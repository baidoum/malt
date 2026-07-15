/**
 * Fonctions utilitaires.
 * 
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * @typedef {Object} Utils
 * @property {(input: string|number|null|undefined, length: number) => string} formatNumeric
 * @property {(input: string|null|undefined, length: number) => string} formatString 
 * @property {(input: string|null|undefined) => string} sanitizeAsciiString
 * @property {(siret: string|undefined, addressInFrance: boolean, refName: string) => string} cleanSiret
 * @property {(input: string|undefined) => string} getCleanedFieldValue
 */

/** @type {Utils} */
define(['N/log', '../libs/ax_lib_errorCollector'],
    /**
     * @param {typeof import('N/log')} log
     * @param {ErrorCollector} errorCollector
     * @returns
     */
    (log, errorCollector) => {

        /**
         * Formate un montant selon les règles suivantes :
         * - arrondi à l’euro
         * - valeurs négatives ou < 1 → 0
         * - longueur fixe
         * - padding gauche avec des zéros
         *
         * @param {string|number|null|undefined} input
         * @param {number} length
         * @returns {string}
         */
        const formatNumeric = (input, length) => {
            let num = 0;

            // 1. Valeur absente → 0
            if (input !== null && input !== undefined && input !== '') {
                num = Number(input);
                if (isNaN(num)) {
                    num = 0;
                }
            }

            // 2. Arrondi à l’euro le plus proche
            num = Math.round(num);

            // 3. Seuls montants ≥ 1
            if (num < 1) {
                num = 0;
            }

            // 4. Conversion en string
            let str = String(num);

            // 5. Tronquage si trop long (sécurité)
            if (str.length > length) {
                str = str.substring(str.length - length); // garde les chiffres de droite
            }

            // 6. Padding gauche avec zéros
            str = '0'.repeat(length - str.length) + str;

            return str;
        }

        /**
         * Formate une string en suivant les règles suivants :
         * - Les seuls caractères autorisés sont ceux de la plage hexadécimale 0x20 à 0x7E.
         * - longueur fixe avec éventuellement tronquage
         * - padding droit avec des espaces
         * 
         * @param {string|null|undefined} input 
         * @param {number} length 
         * @returns {string}
         */
        const formatString = (input, length) => {
            if (!input || typeof input !== "string") {
                input = '';
            }

            // 1. Forcer ASCII
            let str = sanitizeAsciiString(input);

            // 3. Tronquage
            if (str.length > length) {
                str = str.substring(0, length);
            }

            // 4. Padding
            str = str + ' '.repeat(length - str.length);

            return str;
        }

        /**
         * Tranforme une chaine de caractères : 
         * - Les seuls caractères autorisés sont ceux de la plage hexadécimale 0x20 à 0x7E.
         * - Majuscule
         * 
         * @param {string|null|undefined} input 
         * @returns {string}
         */
        const sanitizeAsciiString = (input) => {
            if (!input || typeof input !== "string") {
                input = '';
            }
            
            // 1. Retirer les espaces vides
            let str = input.trim();

            // 2. Remplacement accents
            str = str
                .replace(/[ÀÁÂÃÄÅ]/g, 'A')
                .replace(/[àáâãäå]/g, 'a')
                .replace(/[Ç]/g, 'C')
                .replace(/[ç]/g, 'c')
                .replace(/[ÈÉÊË]/g, 'E')
                .replace(/[èéêë]/g, 'e')
                .replace(/[ÌÍÎÏ]/g, 'I')
                .replace(/[ìíîï]/g, 'i')
                .replace(/[Ñ]/g, 'N')
                .replace(/[ñ]/g, 'n')
                .replace(/[ÒÓÔÕÖ]/g, 'O')
                .replace(/[òóôõö]/g, 'o')
                .replace(/[ÙÚÛÜ]/g, 'U')
                .replace(/[ùúûü]/g, 'u')
                .replace(/[Ýÿ]/g, 'Y')
                .replace(/[ý]/g, 'y')
                .replace(/[Œ]/g, 'OE')
                .replace(/[œ]/g, 'oe')
                .replace(/[Æ]/g, 'AE')
                .replace(/[æ]/g, 'ae');

            // 3. Filtre ASCII strict
            let strCleaned = '';
            for (let i = 0; i < str.length; i++) {
                const c = str.charCodeAt(i);
                if (c >= 0x20 && c <= 0x7E) {
                    strCleaned += str.charAt(i);
                }
            }

            // 4. Uppercase
            strCleaned = strCleaned.toUpperCase();

            return strCleaned;
        }

        /**
         * Retourne le SIRET nettoyé et vérifie que le SIRET est bien composé de 14 chiffres.
         * ❗ Le SIRET est obligatoire pour les entreprises françaises.
         * 
         * @param {string|undefined} siret 
         * @param {boolean} addressInFrance 
         * @param {string} refName
         * @returns {string}
         */
        const cleanSiret = (siret, addressInFrance, refName) => {
            if (!addressInFrance && !siret) {
                return '';
            }

            if (!siret) {
                log.error({
                    title: 'SIRET manquant',
                    details: `${refName}: Le SIRET est manquant.`
                });
                errorCollector.addError(`SIRET manquant - ${refName}: Le SIRET est manquant.`);
                return '';
            }

            // Retirer tous les espaces (\s) et les "/"
            siret = siret.replace(/[\s/]+/g, "");

            if (!(/\d{14}/.test(siret))) {
                log.error({
                    title: 'SIRET erroné',
                    details: `${refName}: Le SIRET n'est pas composé de 14 chiffres.`
                });
                errorCollector.addError(`SIRET erroné - ${refName}: Le SIRET n'est pas composé de 14 chiffres.`);
            }

            return siret;
        }

        /**
         * Retourne une chaine vide si la valeur passée en paramètre vaut '- None -' ou undefined.
         * 
         * @param {string|undefined} input 
         * @returns {string}
         */
        const getCleanedFieldValue = (input) => {
            if (!input || input.toLowerCase() === '- none -') {
                return '';
            }

            return input;
        }

        return { formatNumeric, formatString, sanitizeAsciiString, cleanSiret, getCleanedFieldValue };
    });
