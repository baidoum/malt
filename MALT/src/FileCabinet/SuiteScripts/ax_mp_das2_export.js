/**
 * Script map/reduce de l'export DAS.
 * 
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

/**
 * @typedef {{
 *   subsidiary: { value: string, text: string }
 * } & Record<Exclude<string, 'subsidiary'>, string> } SavedSearchRecord
 */

// Script/déploiement du script scheduled qui écrit les logs de validation dans customrecord_das2_logs
// (processus séparé, cf. ax_ss_das2_logs.js), déclenché depuis summarize().
const LOG_WRITER_SCRIPT_ID = 'customscript_ax_ss_das2_logs'; // TODO: à adapter si l'id diffère au déploiement.
const LOG_WRITER_DEPLOYMENT_ID = 'customdeploy_ax_ss_das2_logs'; // TODO: remplacer par l'id réel une fois le script déployé.

define(['N/error', 'N/file', 'N/log', 'N/record', 'N/runtime', 'N/search', 'N/task', './libs/ax_lib_fileHeaders', './libs/ax_lib_fileFeeLine', './libs/ax_lib_fileFooters', './libs/ax_lib_subsidiaryFormatter', './libs/ax_lib_vendorFormatter', './libs/ax_lib_utils', './libs/ax_lib_errorCollector'],
    /**
     * @param {typeof import('N/error')} error
     * @param {typeof import('N/file')} file
     * @param {typeof import('N/log')} log
     * @param {typeof import('N/record')} record
     * @param {typeof import('N/runtime')} runtime
     * @param {typeof import('N/search')} search
     * @param {typeof import('N/task')} task
     * @param {FileHeaders} fileHeaders
     * @param {FileFeeLine} fileFeeLine
     * @param {FileFooters} fileFooters
     * @param {SubsidiaryFormatter} subsidiaryFormatter
     * @param {VendorFormatter} vendorFormatter
     * @param {Utils} utils
     * @param {ErrorCollector} errorCollector
     * @returns
     */
    (error, file, log, record, runtime, search, task, fileHeaders, fileFeeLine, fileFooters, subsidiaryFormatter, vendorFormatter, utils, errorCollector) => {
        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {import('N/types').EntryPoints.MapReduce.getInputDataContext} inputContext
         * @since 2015.2
         */
        const getInputData = (inputContext) => {
            // Logs de diagnostic temporaires : à retirer une fois le problème de get input data résolu.
            try {
                const savedSearch = search.load({
                    id: 'customsearch_ax_das2'
                });
                log.audit({ title: 'DIAG getInputData 1', details: `search.load OK. Filtres actuels : ${describeFilters(savedSearch.filters)}` });

                // Si l'export a été lancé depuis customrecord_das2, restreindre la recherche à la période demandée
                // en remplaçant le filtre "closedate" par défaut de la recherche sauvegardée.
                const scriptObj = runtime.getCurrentScript();
                const rawDateFrom = scriptObj.getParameter({ name: 'custscript_ax_das2_date_from' });
                const rawDateTo = scriptObj.getParameter({ name: 'custscript_ax_das2_date_to' });
                const dateFrom = parseDateParameter(rawDateFrom);
                const dateTo = parseDateParameter(rawDateTo);
                log.audit({
                    title: 'DIAG getInputData 2',
                    details: `raw dateFrom=${rawDateFrom} -> parsed=${dateFrom}; raw dateTo=${rawDateTo} -> parsed=${dateTo}`
                });

                if (dateFrom && dateTo) {
                    const endOfDay = new Date(dateTo.getTime());
                    endOfDay.setHours(23, 59, 59, 999);

                    // savedSearch.filters retourne une copie à chaque accès : il faut la récupérer une fois,
                    // la modifier, puis la réaffecter pour que le changement soit pris en compte.
                    const filters = savedSearch.filters.filter(f => f.name !== 'closedate');
                    filters.push(search.createFilter({
                        name: 'closedate',
                        operator: search.Operator.WITHIN,
                        values: [dateFrom, endOfDay]
                    }));
                    savedSearch.filters = filters;
                    log.audit({ title: 'DIAG getInputData 3', details: `Filtre closedate appliqué. Filtres finaux : ${describeFilters(savedSearch.filters)}` });
                }

                // Exécuter la recherche nous-mêmes avant de la retourner : si elle est mal formée
                // (filtre invalide, etc.), l'erreur remonte ici plutôt que de faire échouer silencieusement
                // l'exécution interne du get input data par NetSuite, où nous ne pouvons rien logger.
                const testRange = savedSearch.run().getRange({ start: 0, end: 1 });
                log.audit({ title: 'DIAG getInputData 4', details: `Test d'exécution de la recherche OK. ${testRange.length} résultat(s) sur la 1ère page.` });

                return savedSearch;
            }
            catch (e) {
                log.error({
                    title: 'getInputData a échoué',
                    details: `${e.name}: ${e.message}\n${e.stack || ''}`
                });
                throw e;
            }
        }

        /**
         * @param {import('N/search').Filter[]} filters
         * @returns {string}
         */
        const describeFilters = (filters) => {
            return filters.map(f => `${f.name} ${f.operator} ${JSON.stringify(f.values)}`).join(' | ');
        }

        /**
         * Convertit la valeur d'un paramètre de script de type Date en objet Date.
         *
         * NetSuite peut restituer un paramètre de type Date sous forme de chaine au format "JJ/MM/AAAA"
         * (plutôt qu'un objet Date) lorsqu'il est transmis via N/task.create(). Le constructeur natif
         * `new Date(...)` interprète les chaines au format MM/JJ/AAAA : sur une date comme "31/12/2025",
         * cela produit silencieusement un "Invalid Date" plutôt qu'une erreur.
         *
         * @param {Date|string|null} value
         * @returns {Date|null}
         */
        const parseDateParameter = (value) => {
            if (!value) {
                return null;
            }
            if (value instanceof Date) {
                return value;
            }

            const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
            if (match) {
                const [, day, month, year] = match;
                return new Date(Number(year), Number(month) - 1, Number(day));
            }

            const fallback = new Date(value);
            return isNaN(fallback.getTime()) ? null : fallback;
        }

        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * 
         * @param {import('N/types').EntryPoints.MapReduce.mapContext} mapContext
         *     Data collection containing the key-value pairs to process in the map stage.
         *     This parameter is provided automatically based on the results of the getInputData stage.
         * @since 2015.2
         */
        const map = (mapContext) => {
            var object = JSON.parse(mapContext.value);
            //log.debug('map', object);

            const siren = utils.getCleanedFieldValue(object.values["GROUP(formulanumeric)"]);
            mapContext.write({
                key: siren,
                value: object.values
            });       
        }

        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * 
         * @param {import('N/types').EntryPoints.MapReduce.reduceContext} reduceContext 
         *     Data collection containing the groups to process in the reduce stage.
         *     This parameter is provided automatically based on the results of the map stage.
         * @since 2015.2
         */
        const reduce = (reduceContext) => {
            //log.debug('reduce', reduceContext);

            // 1. Récupérer les paramètres du script
            const scriptObj = runtime.getCurrentScript();
            const startUnitsAvailable = scriptObj.getRemainingUsage();
            const exportFolder = Number(scriptObj.getParameter({ name: 'custscript_ax_export_folder' }));
            const dasRecordId = scriptObj.getParameter({ name: 'custscript_ax_das2_record_id' });

            // 2. Regrouper les lignes par SIRET et récupérer l'année fiscale.
            let fiscalYear = '';
            const objects = reduceContext.values;
            const /** @type {Record<string, any[]>} */ subsidiaries = {};
            for (const jsonData of objects) {
                const raw = JSON.parse(jsonData);

                // 2.1. Récupérer l'année fiscale.
                if (!fiscalYear) {
                    fiscalYear = raw["GROUP(formulatext)"];
                }

                // 2.2. Regrouper les lignes par SIRET
                const siret = raw["GROUP(custrecord_emea_company_reg_num.subsidiary)"];
                if (!subsidiaries[siret]) {
                    subsidiaries[siret] = [];
                }
                subsidiaries[siret].push(raw);
            }

            // Ne pas aller plus loin si l'année fiscale n'a pu être récupérée...
            if (!fiscalYear) {
                throw error.create({
                    name: 'FISCAL_YEAR_NOT_FOUND',
                    message: "Impossible de récupérer l'année fiscale.",
                });
            }

            // 3. Créer les lignes d'en-tête et d'honoraires de l'établissement.
            let subsidiaryEnterprise;
            let establishmentLines = '';
            let globalTotal = 0;
            let nbSubsidiaries = 0;
            let nbFeeLines = 0;
            for (const subsidiarySiret in subsidiaries) {
                let subsidiaryTotal = 0;
                let subsidiary = undefined;

                // 3.1. Récupèrer la map disant, pour chaque vendor, s'il a au moins un contact ayant accès à la plateforme.
                const records = subsidiaries[subsidiarySiret];
                const vendorContacts = vendorFormatter.getVendorContacts(records);

                for (const raw of records) {
                    // 3.2. Récupérer les infos de la subsidiary
                    if (!subsidiary) {
                        //const subsidiary = subsidiaryFormatter.getSubsidiary(subsidiarySiret);
                        subsidiary = subsidiaryFormatter.getSubsidiary(raw);

                        // 3.3. Si la subsidiary de l'entreprise n'a pas encore été défini, reprendre les infos de la 1ère subsidiary.
                        if (!subsidiaryEnterprise) {
                            subsidiaryEnterprise = subsidiary;
                        }
                    }

                    // 3.4. Créer les lignes d'honoraires
                    // 3.4.1. Récupérer les infos du vendor
                    const vendor = vendorFormatter.getVendor(raw, vendorContacts);
                    //log.debug('vendor', vendor);

                    // 3.4.2. Uniquement les bénéficiaires dont le total payé > à 2.400 € doivent être déclarés
                    if (vendor.amount < 2400) {
                        continue;
                    }

                    // 3.4.3. Créer la ligne
                    establishmentLines += fileFeeLine.getFeeLine(subsidiary.siret, fiscalYear, vendor);

                    // 3.4.4. Totaux
                    subsidiaryTotal += vendor.amount;
                    nbFeeLines++;
                }

                if (subsidiary && establishmentLines) {
                    // 3.5. Créer les ligne d'en-tête et total de l'ébalissement
                    establishmentLines = fileHeaders.getEstablishmentHeaderLine(subsidiary, fiscalYear) 
                                        + establishmentLines
                                        + fileFooters.getEstablishmentFooterLine(subsidiary, fiscalYear, subsidiaryTotal);

                    // 3.6. Les totaux de l'entreprise
                    globalTotal += subsidiaryTotal;
                    nbSubsidiaries++;
                }
            }

            // 3.7. Vider le collecteur d'erreurs de validation accumulées pendant le traitement de ce groupe
            // (SIRET/APE/adresse/INSEE/contact DAS2/prénom manquants...) et les transmettre à la summarize,
            // qui les transmettra à ax_ss_das2_logs.js pour l'enregistrement dans customrecord_das2_logs.
            const validationErrors = errorCollector.getErrors();
            errorCollector.clear();
            if (validationErrors.length) {
                reduceContext.write({
                    key: `ERR::${reduceContext.key}`,
                    value: JSON.stringify({ messages: validationErrors })
                });
            }

            if (subsidiaryEnterprise && establishmentLines) {
                // 4. Les lignes d'en-tête et de total de l'entreprise
                const companyHeaderLine = fileHeaders.getCompanyHeaderLine(subsidiaryEnterprise);
                const companyTotalLine = fileFooters.getCompanyFooterLine(subsidiaryEnterprise, nbSubsidiaries, nbFeeLines, globalTotal);

                // 5. Générer le fichier
                const filename = getFilename(subsidiaryEnterprise.siren, fiscalYear);
                const fileObj = file.create({
                    name: filename,
                    contents: companyHeaderLine + establishmentLines + companyTotalLine,
                    encoding: file.Encoding.UTF_8,
                    fileType: file.Type.PLAINTEXT,
                    folder: exportFolder
                });
                const fileSave = fileObj.save();

                // 5.1. Relier le fichier généré à l'enregistrement customrecord_das2 qui a déclenché l'export.
                if (dasRecordId) {
                    record.submitFields({
                        type: 'customrecord_das2',
                        id: dasRecordId,
                        values: { custrecord_das2_doc: fileSave }
                    });
                }

                reduceContext.write({
                    key: subsidiaryEnterprise.siren,
                    value: JSON.stringify({
                        fileId: fileSave,
                        nbSubsidiaries: nbSubsidiaries,
                        nbLines: 2 + (2 * nbSubsidiaries) + nbFeeLines,
                    })
                });

                // Informations sur les unités utilisées.
                const endUnitsAvailable = scriptObj.getRemainingUsage();
                const UnitsUsed = startUnitsAvailable - endUnitsAvailable;
                log.debug({ title: "Units used", details: `${startUnitsAvailable} - ${endUnitsAvailable} = ${UnitsUsed}` });
            }
        }

        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * 
         * @param {import('N/types').EntryPoints.MapReduce.summarizeContext} summaryContext 
         *     Statistics about the execution of a map/reduce script
         * @since 2015.2
         */
        const summarize = (summaryContext) => {
            //log.debug('summarize', summaryContext);

            const scriptObj = runtime.getCurrentScript();
            const dasRecordId = scriptObj.getParameter({ name: 'custscript_ax_das2_record_id' });
            const exportFolder = Number(scriptObj.getParameter({ name: 'custscript_ax_export_folder' }));

            // Regroupe les erreurs de validation écrites par reduce() (clés "ERR::...") pour les transmettre,
            // via un fichier, au script séparé qui les enregistrera dans customrecord_das2_logs.
            const /** @type {string[]} */ validationErrors = [];

            summaryContext.output.iterator().each((key, value) => {
                const data = JSON.parse(value);

                if (key.startsWith('ERR::')) {
                    validationErrors.push(...data.messages);
                    return true;
                }

                log.audit({
                    title: `DAS2 ${key}`,
                    details: `
                        Fichier : ${data.fileId}\n
                        Lignes : ${data.nbLines}\n
                        Etablissements : ${data.nbSubsidiaries}\n
                        ➡️ Consultez les logs pour corriger les données du CRM ou adapter le fichier exporté.
                    `
                });

                return true;
            });

            // Écrit les erreurs de validation dans un fichier et déclenche ax_ss_das2_logs.js (processus séparé)
            // pour les enregistrer dans customrecord_das2_logs, sans consommer la gouvernance de ce map/reduce.
            if (dasRecordId && validationErrors.length) {
                const queueFile = file.create({
                    name: `das2_errors_${dasRecordId}_${new Date().getTime()}.json`,
                    contents: JSON.stringify({ recordId: dasRecordId, errors: validationErrors }),
                    encoding: file.Encoding.UTF_8,
                    fileType: file.Type.JSON,
                    folder: exportFolder
                });
                const queueFileId = queueFile.save();

                task.create({
                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                    scriptId: LOG_WRITER_SCRIPT_ID,
                    deploymentId: LOG_WRITER_DEPLOYMENT_ID,
                    params: {
                        custscript_ax_das2log_queue_file_id: queueFileId
                    }
                }).submit();
            }

            // Erreurs MAP
            summaryContext.mapSummary.errors.iterator().each((key, error) => {
                log.error({
                    title: `Erreur MAP ${key}`,
                    details: error
                });

                return true;
            });

            // Erreurs REDUCE
            summaryContext.reduceSummary.errors.iterator().each((key, error) => {
                log.error({
                    title: `Erreur REDUCE ${key}`,
                    details: error
                });

                return true;
            });
        }

        /**
         * Retourne le nom du fichier d'export.
         * 
         * Le nom du fichier qui sera transmis à l’administration sur le portail Télé-TD, accessible exclusivement 
         * depuis l’Espace professionnel du site impots.gouv.fr doit impérativement respecter le format suivant :
         * 	      <valeur fixe>_<millésime>_<identifiant>_<ordre>_<horodatage>.<extension>
         * où :
         *   - valeur fixe : valeur qui permettant d’identifier la nature des informations contenues dans le fichier : «DSAL » ;
         *   - millésime : millésime de la déclaration, c’est-à-dire l’année 2024 ;
         *   - identifiant : SIREN (ou à défaut l’IDSP) d’appartenance de l’usager connecté à son espace professionnel et qui dépose le fichier ou SIRET (ou IDSP + pseudo-NIC)
         *   - ordre : numéro d’ordre sur 3 caractères numériques, incrémenté à raison de chaque déclaration successive transmise au titre du même millésime ;
         *   - horodatage : horodatage (année, mois, jour, heure, minute, seconde) de création du fichier exprimée sous la forme AAAAMMJJHHMMSS ;
         *   - extension : extension du fichier désignant son type. Il s’agit obligatoirement d’un fichier texte. L’extension est donc de type .txt.
         * 
         * @param {string|undefined} siren 
         * @param {string} fiscalYear
         * @returns 
         */
        const getFilename = (siren, fiscalYear) => {
            const horodatage = new Date().toISOString().replace(/(\.\d{3})|[^\d]/g,'');
            return `DSAL_${fiscalYear}_${siren}_001_${horodatage}.txt`;
        }

        return {getInputData, map, reduce, summarize}

    });
