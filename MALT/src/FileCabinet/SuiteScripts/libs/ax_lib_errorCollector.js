/**
 * Collecteur des erreurs de validation de l'export DAS2.
 *
 * Les libs de formatage (ax_lib_utils, ax_lib_addressFormatter, ax_lib_subsidiaryFormatter,
 * ax_lib_vendorFormatter) empilent ici leurs erreurs de validation en plus de leur log.error()
 * habituel. Le reduce de ax_mp_das2_export.js vide ce collecteur après chaque groupe traité et
 * transmet les messages à la summarize, qui les écrit dans un fichier et déclenche ax_ss_das2_logs.js
 * (processus séparé) pour les enregistrer dans customrecord_das2_logs sans consommer la gouvernance
 * du map/reduce.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * @typedef {Object} ErrorCollector
 * @property {(message: string) => void} addError
 * @property {() => string[]} getErrors
 * @property {() => void} clear
 */

/** @type {ErrorCollector} */
define([], () => {

    /** @type {string[]} */
    let errors = [];

    /**
     * @param {string} message
     */
    const addError = (message) => {
        errors.push(message);
    }

    /**
     * @returns {string[]}
     */
    const getErrors = () => errors;

    const clear = () => {
        errors = [];
    }

    return { addError, getErrors, clear };
});
