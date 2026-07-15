/**
 * "Subsidiary".
 * 
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * @typedef {{
 *   name: string,
 *   siret: string,
 *   siren: string,
 *   address?: FormatedAddress,
 *   ape: string,
 *   mainActivity?: string,
 *   contactName?: string,
 *   contactPhone?: string,
 *   contactEmail?: string,
 *   contactSiren?: string
 * }} Subsidiary
 */ 
 
/** 
 * @typedef {Object} SubsidiaryFormatter
 * @property {(raw: any) => Subsidiary} getSubsidiary
 */

/** @type {SubsidiaryFormatter} */
define(['N/log', '../libs/ax_lib_addressFormatter', '../libs/ax_lib_utils', '../libs/ax_lib_errorCollector'],
    /**
     * @param {typeof import('N/log')} log
     * @param {AddressFormatter} addressFormatter
     * @param {Utils} utils
     * @param {ErrorCollector} errorCollector
     * @returns
     */
    (log, addressFormatter, utils, errorCollector) => {

        /**
         * Récupére et formate les infos d'un subsidiary sur base de son ID.
         * 
         * @param {any} raw 
         * @returns {Subsidiary}
         */
        const getSubsidiary = (raw) => {
            const /** @type {Subsidiary} */ subsidiary = {};
            
            subsidiary.name = utils.getCleanedFieldValue(raw["GROUP(legalname.subsidiary)"]);

            subsidiary.address = addressFormatter.formatAddress({
                name:         `Subsidiary ${subsidiary.name}`,
                address1:     utils.getCleanedFieldValue(raw["GROUP(address1.subsidiary)"]),
                address2:     utils.getCleanedFieldValue(raw["GROUP(address2.subsidiary)"]),
                zip:          utils.getCleanedFieldValue(raw["GROUP(zip.subsidiary)"]),
                city:         utils.getCleanedFieldValue(raw["GROUP(city.subsidiary)"]),
                country:      utils.getCleanedFieldValue(raw["GROUP(country.subsidiary)"]?.value),
                insee:        utils.getCleanedFieldValue(raw["GROUP(custrecord_ax_insee.subsidiary)"]),
                countryInsee: ''
            });

            subsidiary.siret = utils.cleanSiret(
                utils.getCleanedFieldValue(raw["GROUP(custrecord_emea_company_reg_num.subsidiary)"]), 
                subsidiary.address.isInFrance, `
                Subsidiary: ${subsidiary.name}`  
            );
             // SIREN = les 9 premiers chiffres du SIRET
            subsidiary.siren = utils.formatString(utils.getCleanedFieldValue(raw["GROUP(formulanumeric)"]), 9);

            subsidiary.ape = utils.getCleanedFieldValue(raw["GROUP(custrecord_ax_ape.subsidiary)"]);
            if (!subsidiary.ape || !(/^\d{4}[A-Za-z]$/.test(subsidiary.ape))) {
                log.error({
                    title: 'Code APE manquant/erroné',
                    details: `Subsidiary ${subsidiary.name}: Le code APE est manquant ou n'est pas composé de 4 chiffres suivis d'une lettre.`
                });
                errorCollector.addError(`Code APE manquant/erroné - Subsidiary ${subsidiary.name}: Le code APE est manquant ou n'est pas composé de 4 chiffres suivis d'une lettre.`);
            }

            subsidiary.mainActivity = utils.getCleanedFieldValue(raw["GROUP(custrecord_ax_main_activity.subsidiary)"]);

            subsidiary.contactName  = utils.getCleanedFieldValue(raw["GROUP(custrecord_ax_das2_contact_fullname.subsidiary)"]);
            subsidiary.contactPhone = utils.getCleanedFieldValue(raw["GROUP(custrecord_ax_das2_contact_phone.subsidiary)"]);
            subsidiary.contactEmail = utils.getCleanedFieldValue(raw["GROUP(custrecord_ax_das2_contact_email.subsidiary)"]);
            subsidiary.contactSiren = utils.getCleanedFieldValue(raw["GROUP(custrecord_ax_das2_contact_siren.subsidiary)"]);
            if (!subsidiary.contactName || !subsidiary.contactPhone || !subsidiary.contactEmail || !subsidiary.contactSiren) {
                log.error({
                    title: 'Responsable DAS2',
                    details: `
                        Subsidiary ${subsidiary.name}: Des informations sur le responsable DAS2 sont manquantes.\n
                        - Nom et prénom : ${subsidiary.contactName}\n
                        - Téléphone : ${subsidiary.contactPhone}\n
                        - Courriel : ${subsidiary.contactEmail}\n
                        - SIREN : ${subsidiary.contactSiren}
                    `
                });
                errorCollector.addError(`Responsable DAS2 - Subsidiary ${subsidiary.name}: informations manquantes (nom: ${subsidiary.contactName || '-'}, tél: ${subsidiary.contactPhone || '-'}, courriel: ${subsidiary.contactEmail || '-'}, SIREN: ${subsidiary.contactSiren || '-'}).`);
            }

            return subsidiary;
        }        
        
        return { getSubsidiary };

    });
