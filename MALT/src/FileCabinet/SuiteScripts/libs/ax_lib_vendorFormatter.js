/**
 * "Vendor".
 * 
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   firstname: string,
 *   lastname: string,
 *   siret: string,
 *   address: FormatedAddress,
 *   job: string,
 *   amount: number,
 * }} Vendor
 */ 

/** 
 * @typedef {Object} VendorFormatter
 * @property {(jsonData: string, vendorContacts: Map<string, boolean>) => Vendor} getVendor
 * @property {(objects: string[]) => Map<string, boolean>} getVendorContacts
 */

/** @type {VendorFormatter} */
define(['N/log', 'N/search', '../libs/ax_lib_addressFormatter', '../libs/ax_lib_utils', '../libs/ax_lib_errorCollector'],
    /**
     * @param {typeof import('N/log')} log
     * @param {typeof import('N/search')} search
     * @param {AddressFormatter} addressFormatter
     * @param {Utils} utils
     * @param {ErrorCollector} errorCollector
     * @returns
     */
    (log, search, addressFormatter, utils, errorCollector) => {

        /**
         * Formate les infos d'un vendor.
         * 
         * @param {any} raw
         * @param {Map<string, boolean>} vendorContacts
         * @returns {Vendor}
         */
        const getVendor = (raw, vendorContacts) => {
            const /** @type {Vendor} */ vendor = {};
            vendor.id = utils.getCleanedFieldValue(raw["GROUP(internalid.vendor)"]["value"]);
            vendor.name = utils.getCleanedFieldValue(raw["GROUP(companyname.vendor)"]);
            vendor.lastname = utils.getCleanedFieldValue(raw["GROUP(lastname.vendor)"]);
            vendor.firstname = utils.getCleanedFieldValue(raw["GROUP(firstname.vendor)"]);
            if (vendor.lastname && !vendor.firstname) {
                log.error({
                    title: "Prénom manquant",
                    details: `Vendor: ${vendor.name} : Le nom a été défini mais pas prénom.`
                });
                errorCollector.addError(`Prénom manquant - Vendor: ${vendor.name} : Le nom a été défini mais pas prénom.`);
            }

            vendor.address = addressFormatter.formatAddress({
                name:         `Vendor ${vendor.name}`,
                address1:     utils.getCleanedFieldValue(raw["GROUP(billaddress1.vendor)"]),
                address2:     utils.getCleanedFieldValue(raw["GROUP(billaddress2.vendor)"]),
                zip:          utils.getCleanedFieldValue(raw["GROUP(billzipcode.vendor)"]),
                city:         utils.getCleanedFieldValue(raw["GROUP(billcity.vendor)"]),
                country:      utils.getCleanedFieldValue(raw["GROUP(billcountry.vendor)"]),
                insee:        utils.getCleanedFieldValue(raw["GROUP(custentity_bwk_insee.vendor)"]),
                countryInsee: utils.getCleanedFieldValue(raw["GROUP(custentitycustbody_code_pays_insee.vendor)"])
            }); 

            vendor.job = utils.getCleanedFieldValue(raw["GROUP(custentity_bwk_job_das2.vendor)"]);
            // Si le job n'est pas indiqué dans la fiche du vendor et que le vendor a au moins un contact ayant accès à la platform,
            // alors indiquer "freelance".
            if (!vendor.job && vendorContacts.get(vendor.id) === true) {
                vendor.job = 'freelance';
            }

            vendor.siret = utils.cleanSiret(
                utils.getCleanedFieldValue(raw["GROUP(custentity_bwk_siret.vendor)"]), 
                vendor.address.isInFrance, 
                `Vendor: ${vendor.name}`
            );

            // Les montants doivent être arrondis à l'euro le plus proche.
            const amount = Number(raw["SUM(amount)"]);
            // Les taxes sont retournées sous forme de nombre négatif. Les rendre positif pour déterminer le montant total payé par le fournisseur.
            const tax = Math.abs(Number(raw["SUM(taxamount)"]));
            vendor.amount = Math.round(amount + tax);

            return vendor;
        }

        /**
         * Retourne une map disant, pour chaque vendor, s'il a au moins un contact ayant accès à la plateforme ou non.
         * 
         * @param {any[]} records 
         * @returns {Map<string, boolean>}
         */
        const getVendorContacts = (records) => {
            // 1. Récupérer les ids des vendors
            const vendorIds = Array.from(new Set(
                records.map(o => o['GROUP(internalid.vendor)'].value)
            ));

            // 2. Recherche les contacts des vendors
            const contactSearch = search.create({
                type: search.Type.CONTACT,
                filters: [
                    ['company', 'anyof', vendorIds],
                    'AND',
                    ['isinactive', 'is', 'F']
                ],
                columns: [
                    'internalid',
                    'company',
                    'giveaccess',
                ]
            });

            // 3. Construire une map vendor → contacts
            const vendorContactsMap = new Map();

            contactSearch.run().each(result => {
                const vendorId = /** @type {string} */ (result.getValue('company'));
                const hasAccess = result.getValue('giveaccess') === 'T';

                if (hasAccess) {
                    vendorContactsMap.set(vendorId, true);
                } 
                else if (!vendorContactsMap.has(vendorId)) {
                    vendorContactsMap.set(vendorId, false);
                }

                return true;
            });

            return vendorContactsMap;
        }

        return { getVendor, getVendorContacts };
    });