/**
 * Fonctions construisant les lignes "total" du fichier exporté.
 * 
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * @typedef {Object} FileFooters
 * @property {(subsidiary: Subsidiary, nbEtablishments: number, nbFeeLines: number, totalHonoraires: number) => string} getCompanyFooterLine
 * @property {(subsidiary: Subsidiary, fiscalYear: string, totalAmount: number) => string} getEstablishmentFooterLine
 */

/** @type {FileFooters} */
define(['N/log', '../libs/ax_lib_utils'],
    /**
     * @param {typeof import('N/log')} log
     * @param {Utils} utils 
     * @returns 
     */
    (log, utils) => {

        /**
         * Retourne la ligne total d'un entreprise.
         * 
         * @param {Subsidiary} subsidiary
         * @param {number} nbEtablishments 
         * @param {number} nbFeeLines 
         * @param {number} totalHonoraires 
         * @returns {string}
         */
        const getCompanyFooterLine = (subsidiary, nbEtablishments, nbFeeLines, totalHonoraires) => {
            let footer = '';

            // | Zone | Désignation                                                             | Long. | Position  | Type |
            // | ---- | ----------------------------------------------------------------------- | ----- | --------- | ---- |
            // | 003  | N° SIREN Entreprise (9 premiers car. du SIRET)                          | 9     | 1-9       | Text |
            footer += utils.formatString(subsidiary.siren, 9);
            // | 004  | Zone à "9" : 12 "9"                                                     | 12    | 10-21     | Num  |
            footer += '9'.repeat(12);  
            // | 009  | Type enregistrement : valeur fixe "310"                                 | 3     | 22-24     | Num  |
            footer += "310";
            // | 011  | Nombre d'établissements	                                                | 5	    | 25-29	    | Num  |
            footer += utils.formatNumeric(nbEtablishments, 5);
            // | 012  | Nombre de lignes salariés	                                            | 6	    | 30-35	    | Num  |
            footer += '0'.repeat(6);
            // | 013  | Nombre de lignes honoraires	                                            | 6	    | 36-41	    | Num  |
            footer += utils.formatNumeric(nbFeeLines, 6);
            // | 014  | Zone réservée : 18 espaces                                              | 18    | 42-59     | Text |
            footer += ' '.repeat(18);
            // | 017  | ** Totaux salariés **                                                   |       |           |      |
            // | 018  | Zone réservée : 18 espaces                                              | 18    | 60-77     | Text |
            footer += ' '.repeat(18);
            // | 021  | Total base brute fiscale entreprise		                                | 12	| 78-89     | Num  |
            footer += "0".repeat(12);
            // | 022  | Total rémunérations nettes entreprise		                            | 12	| 90-101	| Num  |
            footer += "0".repeat(12);
            // | 023  | Total avantages en nature entreprise		                            | 12	| 102-113	| Num  |
            footer += "0".repeat(12);
            // | 024  | Total frais professionnels entreprise		                            | 12	| 114-125	| Num  |
            footer += "0".repeat(12);
            // | 025  | Total chèques vacances entreprise		                                | 12	| 126-137	| Num  |
            footer += "0".repeat(12);
            // | 027  | Total imposable taxe salaires entreprise		                        | 12	| 138-149	| Num  |
            footer += "0".repeat(12);
            // | 028  | Total base 1er taux majoré entreprise		                            | 12	| 150-161	| Num  |
            footer += "0".repeat(12);
            // | 029  | Total base 2ème taux majoré entreprise		                            | 12	| 162-173	| Num  |
            footer += "0".repeat(12);
            // | 030  | Total retenues à la source salariés entreprise		                    | 12	| 174-185	| Num  |
            footer += "0".repeat(12);
            // | 032  | ** Totaux honoraires **                                                 |       |           |      | 
            // | 033  | Total honoraires, vacations entreprise		                            | 12	| 186-197	| Num  |
            footer += utils.formatNumeric(totalHonoraires, 12);
            // | 034  | Total commissions entreprise		                                    | 12	| 198-209	| Num  |
            footer += "0".repeat(12);
            // | 035  | Total courtages entreprise		                                        | 12	| 210-221	| Num  |
            footer += "0".repeat(12);
            // | 036  | Total ristournes entreprise		                                        | 12	| 222-233	| Num  |
            footer += "0".repeat(12);
            // | 037  | Total jetons de présence entreprise		                                | 12	| 234-245	| Num  |
            footer += "0".repeat(12);
            // | 038  | Total droits d'auteur entreprise		                                | 12	| 246-257	| Num  |
            footer += "0".repeat(12);
            // | 039  | Total droits d'inventeur entreprise		                                | 12	| 58-269	| Num  |
            footer += "0".repeat(12);
            // | 040  | Total autres rémunérations entreprise		                            | 12	| 270-281	| Num  |
            footer += "0".repeat(12);
            // | 041  | Total indemnités et remboursements entreprise		                    | 12	| 282-293	| Num  |
            footer += "0".repeat(12);
            // | 042  | Total avantages en nature honoraires entreprise		                    | 12	| 294-305	| Num  |
            footer += "0".repeat(12);
            // | 043  | Total retenues à la source honoraires entreprise		                | 12	| 306-317	| Num  |
            footer += "0".repeat(12);
            // | 045  | Zone réservée : 12 espaces                                              | 12	| 318-329	| Text |
            footer += ' '.repeat(12);	
            // |      | ** Divers **                                                            |       |           |      | 
            // | 047  | Montant de la taxe sur les salaires due (entreprise)		            | 12	| 330-341	| Num  |
            footer += "0".repeat(12);
            // | 048  | Total brut HS/compl./JRTT monétisées 2024	                            | 12	| 342-353	| Num  |
            footer += "0".repeat(12);
            // | 050  | Total effectif au 31 décembre		                                    | 6	    | 354-359	| Num  |
            footer += "0".repeat(6);
            // | 051  | Zone réservée : 48 espaces		                                        | 48	| 360-407	| Text |
            footer += ' '.repeat(48);
            // | 055  | Total base imposable PEEC / PEEC agricole entreprise		            | 12	| 408-419	| Num  |
            footer += "0".repeat(12);
            // | 056  | Zone réservée : 253 espaces                                             | 253   | 420-672   | Text |
            footer += ' '.repeat(253);

            return footer + '\n';
        }

        /**
         * Retourne la ligne total d'un établissement.
         * 
         * @param {Subsidiary} subsidiary
         * @param {string} fiscalYear
         * @param {number} totalHonoraires
         * @returns {string}
         */
        const getEstablishmentFooterLine = (subsidiary, fiscalYear, totalHonoraires) => { 
            let footer = '';

            // | Zone    | Désignation                                                          | Long. | Position  | Type |
            // | ------- | -------------------------------------------------------------------- | ----- | --------- | ---- |
            // | 002-004 | N° SIRET Etablissement                                               | 14    | 1-14      | Text |
            footer += utils.formatString(subsidiary.siret, 14);
            // | 005     | Code section d'établissement : valeur fixe "01"                      | 2     | 15-16     | Num  |
            footer += "01";
            // | 006     | Validité                                                             | 4     | 17-20     | Num  |
            footer += fiscalYear;
            // | 007     | Type DADS : valeur fixe "1" (= Honoraires seuls - un seul fichier)   | 1     | 21        | Num  |
            footer += "1";
            // | 009     | Type enregistrement : valeur fixe "300"                              | 3     | 22-24     | Num  |
            footer += "300";
            // | 011     | ** Totaux salariés **                                                |       |           |      |
            // | 015     | Zone réservée : 36 espaces                                           | 36    | 25-60     | Text |
            footer += ' '.repeat(36);
            // | 018	 | Total base brute fiscale	                                            | 12	| 61-72	    | Num  |
            footer += "0".repeat(12);
            // | 019	 | Total rémunérations nettes (102+103+142+144)	                        | 12	| 73-84	    | Num  |
            footer += "0".repeat(12);
            // | 020	 | Total avantages en nature (valeur)		                            | 12	| 85-96	    | Num  |
            footer += "0".repeat(12);
            // | 021	 | Total frais professionnels		                                    | 12	| 97-108	| Num  |
            footer += "0".repeat(12);	
            // | 022	 | Total chèques vacances		                                        | 12	| 109-120	| Num  |
            footer += "0".repeat(12);
            // | 025	 | Total imposable taxe sur les salaires		                        | 12	| 121-132	| Num  |
            footer += "0".repeat(12);
            // | 026	 | Total base imposable 1er taux majoré		                            | 12	| 133-144	| Num  |
            footer += "0".repeat(12);
            // | 027 	 | Total base imposable 2ème taux majoré		                        | 12	| 145-156	| Num  |
            footer += "0".repeat(12);
            // | 028	 | Total retenues à la source salariés		                            | 12	| 157-168	| Num  |
            footer += "0".repeat(12);
            // | 030     | ** Totaux honoraires **                                              |       |           |      | 
            // | 031	 | Total honoraires, vacations : total des zones 038 des fichiers 210   | 12	| 169-180	| Num  |
            footer += utils.formatNumeric(totalHonoraires, 12);
            // | 032	 | Total commissions		                                            | 12	| 181-192	| Num  |
            footer += "0".repeat(12);
            // | 033	 | Total courtages		                                                | 12	| 193-204	| Num  |
            footer += "0".repeat(12);
            // | 034	 | Total ristournes		                                                | 12	| 205-216	| Num  |
            footer += "0".repeat(12);
            // | 035	 | Total jetons de présence		                                        | 12	| 217-228	| Num  |
            footer += "0".repeat(12);
            // | 036	 | Total droits d'auteur		                                        | 12	| 229-240	| Num  |
            footer += "0".repeat(12);
            // | 037	 | Total droits d'inventeur		                                        | 12	| 241-252	| Num  |
            footer += "0".repeat(12);
            // | 038	 | Total autres rémunérations		                                    | 12	| 253-264	| Num  |
            footer += "0".repeat(12);
            // | 039	 | Total indemnités et remboursements		                            | 12	| 265-276	| Num  |
            footer += "0".repeat(12);
            // | 040	 | Total avantages en nature honoraires		                            | 12	| 277-288	| Num  |
            footer += "0".repeat(12);
            // | 041	 | Total retenues à la source honoraires		                        | 12	| 289-300	| Num  |
            footer += "0".repeat(12);					
            // | 042	 | Zone réservée : 12 espaces                                           | 12	| 301-312	| Text |
            footer += ' '.repeat(12);	
            // |         | ** Divers **                                                         |       |           |      |
            // | 046	 | Montant de la taxe sur les salaires due	                            | 12	| 313-324	| Num  |
            footer += "0".repeat(12);
            // | 047	 | Total du montant exonéré brut des heures complémentaires et          |       |           |      |
            // |         |   supplémentaires et des JRTT monétisées payées en 2024              | 12	| 325-336	| Num  |
            footer += "0".repeat(12);
            // | 049	 | Effectif de l'établissement au 31 décembre	                        | 6	    | 337-342	| Num  |
            footer += "0".repeat(6);
            // | 050	 | Zone réservée	: 48 espaces                                        | 48	| 343-390	| Text |
            footer += ' '.repeat(48);
            // | 054	 | Total base imposable PEEC / PEEC agricole		                    | 12	| 391-402	| Num  |
            footer += "0".repeat(12);
            // | 055	 | Zone réservée : 74 espaces	                            		    | 74    | 403-476	| Text |
            footer += ' '.repeat(74);	
            // | 065	 | Nom et prénom du responsable	                                        | 50	| 477-526   | Text |
            footer += utils.formatString(subsidiary.contactName, 50);
            // | 066	 | N° de téléphone du responsable	                                    | 10    | 527-536   | Text |
            footer += utils.formatString(subsidiary.contactPhone, 10);
            // | 067	 | Adresse courriel du responsable	                                    | 60    | 537-596   | Text |
            footer += utils.formatString(subsidiary.contactEmail, 60);
            // | 068	 | SIREN du remettant		                                            | 9	    | 597-605	| Text |
            footer += utils.formatString(subsidiary.contactSiren, 9);
            // | 069     | Zone réservée : 67 espaces                                           | 67    | 606-676   | Text |
            footer += ' '.repeat(67);

            return footer + '\n';
        }

        return { getCompanyFooterLine, getEstablishmentFooterLine };
    });
