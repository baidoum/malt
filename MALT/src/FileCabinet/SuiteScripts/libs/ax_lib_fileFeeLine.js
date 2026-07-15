/**
 * Fonctions construisant une ligne d'honoraire du fichier exporté.
 * 
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * @typedef {Object} FileFeeLine 
 * @property {(subsidiarySiret: string, fiscalYear: string,vendor: Vendor) => string} getFeeLine
 */

/** @type {FileFeeLine} */
define(['../libs/ax_lib_utils'],
    /**
     * @param {Utils} utils 
     * @returns 
     */
    (utils) => {

        /**
         * Génére une ligne d'honoraires.
         * 
         * @param {string} subsidiarySiret
         * @param {string} fiscalYear
         * @param {Vendor} vendor 
         * @returns {string}
         */
        const getFeeLine = (subsidiarySiret, fiscalYear, vendor) => { 
            let line = "";

            // | Zone    | Désignation                                                              | Long. | Position  | Type |
            // | ------- | ------------------------------------------------------------------------ | ----- | --------- | ---- |
            // | 002-004 | N° SIRET Etablissement                                                   | 14    | 1-14      | Text |
            line += utils.formatString(subsidiarySiret, 14);
            // | 005     | Code section d'établissement : valeur fixe "01"                          | 2     | 15-16     | Num  |
            line += "01";
            // | 006     | Validité                                                                 | 4     | 17-20     | Num  |
            line += fiscalYear;
            // | 007     | Type DADS : valeur fixe "1" (= Honoraires seuls - un seul fichier)       | 1     | 21        | Num  |
            line += "1";
            // | 009     | Type enregistrement : valeur fixe "210"                                  | 3     | 22-24     | Num  |
            line += "210";		
            // | 012     | N° SIRET du bénéficiaire                                                 | 14    | 25-38     | Text |
            line += utils.formatString(vendor.siret, 14);
            // | 013     | Nom du bénéficiaire (personne physique)	                                | 30	| 39-68     | Text |
            line += utils.formatString(vendor.lastname, 30);
            // | 014     | Prénoms du bénéficiaire (personne physique)	                            | 20	| 69-88	    | Text |
            line += utils.formatString(vendor.firstname, 20);
            // | 015     | Raison sociale 	                                                        | 50    | 89-138    | Text |
            line += utils.formatString(vendor.name, 50);
            // | 016     | Profession du bénéficiaire                                               | 30    | 139-168   | Text |
            line += utils.formatString(vendor.job, 30);
            // | 019     | Complément d'adresse	                                                    | 32	| 169-200   | Text |
            line += vendor.address?.addressComplement;
            // | 020     | Zone réservée : 1 espace                                                 | 1     | 201       | Text |
            line += ' ';
            // | 022     | Numéro dans la voie	                                                    | 4	    | 202-205	| Num  |
            line += vendor.address?.streetNumber;
            // | 023     | Indice de répétition du numéro de voie	                                | 1	    | 206	    | Text |
            line += vendor.address?.postBox;
            // | 024     | Séparateur : 1 espace                                                    | 1     | 207       | Text |
            line += ' ';
            // | 025     | Nature et nom de la voie	                                                | 26	| 208-233	| Text |
            line += vendor.address?.street;
            // | 027     | Code INSEE commune	                                                    | 5 	| 234-238   | Num  |
            line += vendor.address?.insee;
            // | 028     | Séparateur : 1 espace                                                    | 1     | 239       | Text |
            line += ' ';
            // | 029     | Commune	                                                                | 26    | 240-265   | Text |
            line += vendor.address?.city;
            // | 032     | Code postal	                                                            | 5     | 266-270   | Num  |
            line += vendor.address?.zip;
            // | 033     | Séparateur : 1 espace                                                    | 1     | 271       | Text |
            line += ' ';
            // | 034     | Bureau distributeur	                                                    | 26	| 272-297   | Text |
            line += vendor.address?.bureauDistributeur;
            // | 038     | Honoraires, vacations	                                                | 10	| 298-307   | Num  |
            line += utils.formatNumeric(vendor.amount, 10);
            // | 039     | Commissions	                                                            | 10	| 308-317   | Num  |
            line += "0".repeat(10);
            // | 040     | Courtages	                                                            | 10	| 318-327   | Num  |
            line += "0".repeat(10);
            // | 041     | Ristournes	                                                            | 10	| 328-337   | Num  |
            line += "0".repeat(10);
            // | 042     | Jetons de présence	                                                    | 10	| 338-347   | Num  |
            line += "0".repeat(10);
            // | 043     | Droits d'auteur	                                                        | 10	| 348-357   | Num  |
            line += "0".repeat(10);
            // | 044     | Droits d'inventeur	                                                    | 10	| 358-367   | Num  |
            line += "0".repeat(10);
            // | 045     | Autres rémunérations	                                                    | 10	| 368-377   | Num  |
            line += "0".repeat(10);
            // | 046     | Indemnités et remboursements	                                            | 10	| 378-387   | Num  |
            line += "0".repeat(10);
            // | 047     | Avantages en nature	                                                    | 10	| 388-397   | Num  |
            line += "0".repeat(10);
            // | 048     | Retenue à la source	                                                    | 10	| 398-407   | Num  |
            line += "0".repeat(10);
            // | 051     | Nourriture (N) : N ou espace                                             | 1	    | 408       | Text |
            line += ' ';
            // | 052     | Logement (L) : L ou espace                                               | 1	    | 409       | Text |
            line += ' ';
            // | 053     | Voiture (V) : V ou espace                                                | 1	    | 410       | Text |
            line += ' ';
            // | 054     | Autres (A) : A ou espace                                                 | 1	    | 411       | Text |
            line += ' ';
            // | 055     | Outils NTIC (T) : T ou espace                                            | 1	    | 412       | Text |
            line += ' ';
            // | 058     | Modalité indemnités : Allocations forfaitaires (F) : F ou espace         | 1	    | 413       | Text |
            line += ' ';
            // | 059     | Modalité indemnités : Remboursements réels (R) : R ou espace             | 1	    | 414       | Text |
            line += ' ';
            // | 060     | Modalité indemnités : Prise en charge directe (P) : P ou espace          | 1	    | 415       | Text |
            line += ' ';
            // | 062     | Taux retenue à la source : Réduit (R) : R ou espace                      | 1	    | 416       | Text |
            line += ' ';
            // | 063     | Taux retenue à la source : Dispense (D) : D ou espace                    | 1	    | 417       | Text |
            line += ' ';
            // | 064     | TVA nette sur droits d'auteur		                                    | 10	| 418-427   | Num  |
            line += "0".repeat(10);
            // | 065     | Zone réservée : 245 espaces                                              | 245   | 428-672   | Text |
            line += ' '.repeat(245);

            return line + '\n';
        }

        return { getFeeLine };
    });
