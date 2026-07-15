/**
 * Fonctions de formatage des adresses.
 * 
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/** 
 * @typedef {{
 *   name: string, 
 *   address1?: string, 
 *   address2?: string, 
 *   zip?: string, 
 *   city?: string, 
 *   country?: string, 
 *   insee?: string,
 *   countryInsee?: string
 * }} FormatAddressParams 
 * 
 * @typedef {{
 *   streetNumber: string,
 *   postBox: string,
 *   street: string,
 *   addressComplement: string,
 *   zip: string,
 *   city: string,
 *   insee: string,
 *   bureauDistributeur: string
 *   isInFrance: boolean
 * }} FormatedAddress
 * 
 * @typedef {Object} AddressFormatter
 * @property {(params: FormatAddressParams) => FormatedAddress} formatAddress
 */
 
/** @type {AddressFormatter} */
define(['N/log', '../enum/ax_enum_officialPostBoxCodesEnum', '../enum/ax_enum_roadCodesEnum', '../libs/ax_lib_utils', '../libs/ax_lib_errorCollector'],
    /**
     * @param {typeof import('N/log')} log     *
     * @param {OfficialPostBoxCodesEnum} OfficialPostBoxCodesEnum
     * @param {RoadCodesEnum} RoadCodesEnum
     * @param {Utils} utils
     * @param {ErrorCollector} errorCollector
     * @returns
     */
    (log, OfficialPostBoxCodesEnum, RoadCodesEnum, utils, errorCollector) => {

        /**
         * Formate une adresse postale et retourne un object avec les propriétés suivantes :
         *
         * | Désignation                                       | Long. | Type | Propriété retournée |
         * | --------------------------------------------------| ----- | ---- | ------------------- |
         * | Complément d'adresse                              | 32    | Text | addressComplement   |
         * | Numéro dans la voie (= n° de rue)                 | 4     | Num  | streetNumber        |
         * | Indice de répétition du numéro de voie (= boite ) | 1     | Text | postBox             |
         * | Nature et nom de la voie :                        | 26    | Text | street              |
         * |   - Code de la nature (cfr ax_enum_roadCodesEnum) | 4     | Text |                     |
         * |   - Séparateur (1 espace)                         | 1     | Text |                     |
         * |   - Nom de la voirie                              | 21    | Text |                     |
         * | Code INSEE commune                                | 5     | Num  | insee               |
         * | Commune                                           | 26    | Text | city                |
         * | Code postal                                       | 5     | Num  | zip                 |
         * | Bureau distributeur                               | 26    | Text | bureauDistributeur  |
         * 
         * @param {FormatAddressParams} param0 
         * @returns {FormatedAddress}
         */
        const formatAddress = ({
            name = '',
            address1 = '',
            address2 = '',
            zip = '',
            city = '',
            country = '',
            insee = '',
            countryInsee = ''
        }) => {
            const formatedAddress = {
                streetNumber: '0'.repeat(4),
                postBox: ' ',
                street: ' '.repeat(26),
                addressComplement: ' '.repeat(32),
                zip: '0'.repeat(5),
                city: ' '.repeat(26),
                insee: '0'.repeat(5),
                bureauDistributeur: ' '.repeat(26),
                isInFrance: false, 
            };

            formatedAddress.isInFrance = (country.toLowerCase() === 'fr' || country.toLowerCase() === 'france');

            if (!address1 || !zip || !city) {
                log.error('Adresse manquante ou incomplète', `${name}: L'adresse n'a pas été renseignée ou incomplète.`);
                errorCollector.addError(`Adresse manquante ou incomplète - ${name}: L'adresse n'a pas été renseignée ou incomplète.`);
            }

            // Formattage des adresses françaises.
            if (formatedAddress.isInFrance) {
                formatedAddress.addressComplement = utils.formatString(address2, 32);

                const address = parseAddress(address1);
                formatedAddress.streetNumber = utils.formatNumeric(address.streetNumber, 4);
                formatedAddress.postBox = utils.formatString(address.postBox, 1);

                const parsedStreet = parseStreet(address.street, 4, 21);
                if (address1 && !parsedStreet.code.trim()) {
                    log.error('Nature de la voie non-déterminée', `${name}: La nature de la voie "${address1}" n'a pu être déterminée d'après le répertoire Fantoir.`);
                    errorCollector.addError(`Nature de la voie non-déterminée - ${name}: La nature de la voie "${address1}" n'a pu être déterminée d'après le répertoire Fantoir.`);
                }
                formatedAddress.street = parsedStreet.code + ' ' + parsedStreet.name;

                formatedAddress.zip = utils.formatNumeric(zip, 5);
                formatedAddress.city = utils.formatString(city, 26);
                formatedAddress.bureauDistributeur = utils.formatString(zip + ' ' + city, 26);

                if (insee) {
                    formatedAddress.insee = utils.formatNumeric(insee, 5);
                }
                // Si le code postal est "75009", alors le code INSEE vaut "75109".
                else if (!insee && zip === "75009") { 
                    formatedAddress.insee = "75109";
                }
                if (!formatedAddress.insee || !(/\d{5}/.test(formatedAddress.insee))) {
                    log.error('INSEE maquant/erroné', `${name}: INSEE est manquant ou n'est pas composé de 5 chiffres.`);
                    errorCollector.addError(`INSEE manquant/erroné - ${name}: INSEE est manquant ou n'est pas composé de 5 chiffres.`);
                }
                formatedAddress.insee = utils.formatNumeric(insee, 5);
            }
            else { // Formattage des adresses étrangères.
                formatedAddress.addressComplement = utils.formatString(address2, 32);
                formatedAddress.street = utils.formatString(address1, 26);

                // Pour l'étranger, l'INSEE est l'INSEE du pays.
                formatedAddress.insee = utils.formatNumeric(countryInsee, 5);
                if (formatedAddress.insee && !(/\d{5}/.test(formatedAddress.insee))) {
                    log.error('INSEE erroné', `${name}: INSEE n'est pas composé de 5 chiffres.`);
                    errorCollector.addError(`INSEE erroné - ${name}: INSEE n'est pas composé de 5 chiffres.`);
                }

                // Reprendre le code INSEE du pays. Si inconnu, par défaut : 99999.
                formatedAddress.zip = countryInsee ? formatedAddress.insee : "9".repeat(5);
                formatedAddress.city = utils.formatString(zip + ' ' + city, 26);
                formatedAddress.bureauDistributeur = utils.formatString(countryInsee + ' ' + country, 26);
            }
            
            return formatedAddress;
        }

        /**
         * Parse une adresse sous forme d'une chaine de caractère en un objet séparant le numéro de voirie, la boite postal et le nom de la voirie.
         * 
         * @param {string|null|undefined} address 
         * @returns Un objet avec les propriétés suivantes :
         *  - streetNumber: le numéro de voirie
         *  - postBox: la boite postale
         *  - street: le nom de la voirie
         */
        const parseAddress = (address) => {
            const result = {
                streetNumber: "",
                postBox: "",
                street: ""
            };

            if (!address || typeof address !== "string") {
                return result;
            }

            const input = address.trim();

            // Si le numéro de voirie n'est pas au début de l'adresse, alors il doit être à droite du nom de voirie.
            // Dans ce cas, le numéro de voirie et la boite postale reste dans le champ de la rue.
            if (!(/^\d+/.test(input))) {
                result.street = input;
                return result;
            }

            // 1. Extraire numéro + reste
            const match = input.match(/^(\d+)(.*)$/);
            if (!match) {
                result.street = input;
                return result;
            }

            
            let rest = match[2].trim();
            if (match[1].length <= 4) {
                result.streetNumber = match[1];
            }
            // Si le numéro de voie comporte plus de 4 chiffres, 
            // alors il est reporté au début de la nature et du nom de la voie.
            else {
                rest = match[1] + rest;
            }

            // 2. Extraire indice éventuel
            let repeatIndex = "";

            // cas : -1 ou /1 (suivi éventuellement d'une virgule)
            const indexExactMatch = rest.match(/^[-\/]\s*([A-Za-z0-9]+)\s+(.*)$/);
            if (indexExactMatch) {
                repeatIndex = indexExactMatch[1];
                rest = indexExactMatch[2];
            } 
            else {
                const indexMatch = rest.match(/^([A-Za-z]+|\d+),?\s+(.*)$/);
                if (indexMatch) {
                    let rawIndex = indexMatch[1].toLowerCase();
                    // Parfois, il y a une virgule après la boite postale...
                    rawIndex = rawIndex.replace(/^,\s*/, '');
                    let normalizedIndex = "";

                    // cas mots officiels
                    if (rawIndex in OfficialPostBoxCodesEnum) {
                        normalizedIndex = OfficialPostBoxCodesEnum[rawIndex];
                    }
                    // cas lettre unique ou chiffre
                    else if (/^[a-z]$/i.test(rawIndex) || /^\d+$/.test(rawIndex)) {
                        normalizedIndex = rawIndex;
                    }

                    // uniquement si reconnu comme indice
                    if (normalizedIndex) {
                        repeatIndex = normalizedIndex;
                        rest = indexMatch[2];
                    }
                }                
            }

            result.postBox = repeatIndex;

            // 3. Tout le reste = rue
            result.street = rest;

            return result;
        }

        /**
         * Parse le nom et la nature de la voirie.
         * 
         * @param {string} streetLabel
         * @param {number} roadCodeLength
         * @param {number} roadNameLength 
         * @returns Un object :
         *      - code: le code de la nature de la voirie.
         *      - name: le nom de la voirie (- sa nature)
         */
        const parseStreet = (streetLabel, roadCodeLength = 4, roadNameLength = 21) => {
            const result = {
                code: " ".repeat(roadCodeLength),
                name: " ".repeat(roadNameLength)
            };

            if (!streetLabel || typeof streetLabel !== "string") {
                return result;
            }

            let original = utils.sanitizeAsciiString(streetLabel);
            // Parfois, le numéro est suivi d'une virgule...
            original = original.replace(/^,\s*/, '');

            let roadCode = "";
            let roadName = original;

            // 1. Recherche du type de voie
            for (const libelle of Object.keys(RoadCodesEnum)) {
                const code = RoadCodesEnum[libelle];
                if (original.startsWith(libelle + " ")  // Au cas où le libellé complet serait utilsié
                    || original.startsWith(code + " ")  // Au cas où le code serait utilisé
                    || original == libelle              // Par ex : "grande rue" ou "grand place"
                ) {
                    roadCode = code;
                    roadName = original.slice(libelle.length).trim();
                    break;
                }
            }

            // 3️. Troncature à gauche si le nom est trop long.
            if (roadName.length > roadNameLength) {
                const words = roadName.split(" ");
                let resultat = words.pop(); // dernier mot jamais tronqué

                while (words.length > 0) {
                    const tentative = words[words.length - 1] + " " + resultat;
                    if (tentative.length > roadNameLength) break;
                    resultat = words.pop() + " " + resultat;
                }
                
                roadName = resultat ?? '';
            }

            // 4. Padding pour assurer la longueur
            result.code = utils.formatString(roadCode, roadCodeLength);
            result.name = roadName + ' '.repeat(roadNameLength - roadName.length);

            return result;
        }

        return { formatAddress };

});
