/**
 * Fonctions construisant les headers du fichier exporté.
 * 
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * @typedef {Object} FileHeaders
 * @property {(subsidiary: Subsidiary) => string} getCompanyHeaderLine
 * @property {(subsidiary: Subsidiary, fiscalYear: string) => string} getEstablishmentHeaderLine
 */

/** @type {FileHeaders} */
define(['../libs/ax_lib_utils'],
    /**
     * @param {Utils} utils 
     * @returns 
     */
    (utils) => {

        /**
         * Retourne la ligne de titre d'un entreprise.
         * 
         * @param {Subsidiary} subsidiary
         * @returns {string}
         */
        const getCompanyHeaderLine = (subsidiary) => { 
            let header = '';

            // | Zone | Désignation                                                             | Long. | Position  | Type |
            // | ---- | ----------------------------------------------------------------------- | ----- | --------- | ---- |
            // | 003  | N° SIREN Entreprise (9 premiers car. du SIRET)                          | 9     | 1-9       | Text |
            header += utils.formatString(subsidiary.siren, 9);
            // | 004  | Zone à zéro : 12 zéros                                                  | 12    | 10-21     | Num  |
            header += '0'.repeat(12);            
            // | 009  | Type enregistrement : valeur fixe "010"                                 | 3     | 22-24     | Num  |
            header += "010";
            // | 010  | Zone réservée : 14 espaces                                              | 14    | 25-38     | Text |
            header += ' '.repeat(14);
            // | 012  | Code APE (4 chiffres + lettre) (par ex: "5829C")                        | 5     | 39-43     | Text |
            header += utils.formatString(subsidiary.ape, 5);
            // | 013  | Zone réservée : 4 espaces                                               | 4     | 44-47     | Text |
            header += ' '.repeat(4);
            // | 015  | Identification du déclarant / Raison sociale                            | 50    | 48-97     | Text |
            header += utils.formatString(subsidiary.name, 50);
            // | 019  | Complément d'adresse                                                    | 32    | 98-129    | Text |
            header += subsidiary.address?.addressComplement;
            // | 020  | Zone réservée : 1 espace                                                | 1     | 130       | Text |
            header += ' ';
            // | 022  | Numéro dans la voie                                                     | 4     | 131-134   | Num  |
            header += subsidiary.address?.streetNumber;
            // | 023  | Indice de répétition du numéro de voie                                  | 1     | 135       | Text |
            header += subsidiary.address?.postBox;
            // | 024  | Zone réservée : 1 espace                                                | 1     | 136       | Text |
            header += ' ';
            // | 025  | Nature et nom de la voie                                                | 26    | 137-162   | Text | 
            header += subsidiary.address?.street;
            // | 027  | Code INSEE commune                                                      | 5     | 163-167   | Num  |
            header += subsidiary.address?.insee;
            // | 028  | Zone réservéee : 1 espace                                               | 1     | 168       | Text |
            header += ' ';
            // | 029  | Commune                                                                 | 26    | 169-194   | Text |
            header += subsidiary.address?.city;
            // | 031  | Code postal                                                             | 5     | 195-199   | Num  |
            header += subsidiary.address?.zip;
            // | 032  | Zone réservée : 1 espace                                                | 1     | 200       | Text |
            header += ' ';
            // | 033  | Bureau distributeur                                                     | 26    | 201-226   | Text |
            header += subsidiary.address?.bureauDistributeur;
            // | 035  | Zone réservée : 8 espaces                                               | 8     | 227-234   | Text |
            header += ' '.repeat(8);
            // | 036  | Type de fichiere : F=Collectivités, H=Hôpitaux, X=Honoraires seuls.     | 1     | 235       | Text |
            header += 'X';
            // | 037  | N° SIRET établissement déposant la déclaration de résultats             | 14    | 236-249   | Text |
            header += utils.formatString(subsidiary.siret, 14); 
            // | 038  | Zone réservée : 5 espaces                                               | 5     | 250-254   | Text |
            header += ' '.repeat(5);
            // | 039  | Complément adresse établissement déposant la déclaration de résultats   | 32    | 255-286   | Text |
            header += subsidiary.address?.addressComplement;
            // | 040  | Zone réservée : 1 espace                                                | 1     | 287       | Text |
            header += ' ';
            // | 042  | Numéro dans la voie (établissement déposant)                            | 4     | 288-291   | Num  | 
            header += subsidiary.address?.streetNumber;
            // | 043  | Indice de répétition du numéro de voie (établissement déposant)         | 1     | 292       | Text |
            header += subsidiary.address?.postBox;
            // | 044  | Zone réservée : 1 espace                                                | 1     | 293       | Text | 
            header += ' ';
            // | 045  | Nature et nom de la voie (établissement déposant)                       | 26    | 294-319   | Text | 
            header += subsidiary.address?.street;
            // | 047  | Code INSEE commune (établissement déposant)                             | 5     | 320-324   | Num  |
            header += subsidiary.address?.insee;
            // | 048  | Zone réservée : 1 espace                                                | 1     | 325       | Text | 
            header += ' ';
            // | 049  | Commune (établissement déposant)                                        | 26    | 326-351   | Text |
            header += subsidiary.address?.city;
            // | 051  | Code postal (établissement déposant)                                    | 5     | 352-356   | Num  |
            header += subsidiary.address?.zip;
            // | 052  | Zone réservée : 1 espace                                                | 1     | 357       | Text | 
            header += ' ';
            // | 053  | Bureau distributeur (établissement déposant)                            | 26    | 358-383   | Text |
            header += subsidiary.address?.bureauDistributeur;
            // | 054  | Zone réservée : 1 espace                                                | 1     | 384       | Text |
            header += ' ';
            // | 055  | Zone réservée : 288 espaces                                             | 288   | 385-672   | Text |
            header += ' '.repeat(288);

            return header + '\n';
        }

        /**
         * Retourne la ligne de titre d'un établissement.
         * 
         * @param {Subsidiary} subsidiary
         * @param {string} fiscalYear
         * @returns {string}
         */
        const getEstablishmentHeaderLine = (subsidiary, fiscalYear) => { 
            let header = '';

            // | Zone    | Désignation                                                          | Long. | Position  | Type |
            // | ------- | -------------------------------------------------------------------- | ----- | --------- | ---- |
            // | 002-004 | N° SIRET Etablissement                                               | 14    | 1-14      | Text |
            header += utils.formatString(subsidiary.siret, 14);
            // | 005     | Code section d'établissement : valeur fixe "01"                      | 2     | 15-16     | Num  |
            header += "01";
            // | 006     | Validité                                                             | 4     | 17-20     | Num  |
            header += fiscalYear;
            // | 007     | Type DADS : valeur fixe "1" (= Honoraires seuls - un seul fichier)   | 1     | 21        | Num  |
            header += "1";
            // | 009     | Type enregistrement : valeur fixe "020"                              | 3     | 22-24     | Num  |
            header += "020";
            // | 013     | Zone réservée : 14 espaces                                           | 14    | 25-38     | Text |
            header += ' '.repeat(14);
            // | 014     | Code APE établissement (4 chiffres + lettre)                         | 5     | 39-43     | Text |
            header += utils.formatString(subsidiary.ape, 5);
            // | 016-018 | N° SIRET établissement au 01/01 (si modifié dans l'année)            | 14    | 44-57     | Text |
            header += '0'.repeat(14);
            // | 022     | Zone réservée : 41 espaces                                           | 41    | 58-98     | Text |
            header += ' '.repeat(41);
            // | 024     | Identification de l'établissement (raison sociale)                   | 50    | 99-148    | Text |
            header += utils.formatString(subsidiary.name, 50);
            // | 027     | Complément d'adresse établissement                                   | 32    | 149-180   | Text |
            header += subsidiary.address?.addressComplement;
            // | 028     | Zone réservée : 1 espace                                             | 1     | 181       | Text |
            header += ' ';
            // | 030     | Numéro dans la voie                                                  | 4     | 182-185   | Num  |
            header += subsidiary.address?.streetNumber;
            // | 031     | Indice de répétition du numéro de voie                               | 1     | 186       | Text |
            header += subsidiary.address?.postBox;
            // | 032     | séparateur : 1 espace                                                | 1     | 187       | Text |
            header += ' ';
            // | 033     | Nature et nom de la voie                                             | 26    | 188-213   | Text |
            header += subsidiary.address?.street;
            // | 035     | Code INSEE commune                                                   | 5     | 214-218   | Num  |
            header += subsidiary.address?.insee;
            // | 036     | séparateur : 1 espace                                                | 1     | 219       | Text |
            header += ' ';
            // | 037     | Commune                                                              | 26    | 220-245   | Text |
            header += subsidiary.address?.city;
            // | 039     | Code postal                                                          | 5     | 246-250   | Num  |
            header += subsidiary.address?.zip;
            // | 040     | séparateur : 1 espace                                                | 1     | 251       | Text |
            header += ' ';
            // | 041     | Bureau distributeur                                                  | 26    | 252-277   | Text |
            header += subsidiary.address?.bureauDistributeur;
            // | 045     | Profession ou activité principale de l'établissement                 | 40    | 278-317   | Text |
            header += utils.formatString(subsidiary.mainActivity, 40);
            // | 046     | Zone réservée : 53 espaces                                           | 53    | 318-370   | Text |
            header += ' '.repeat(53);
            // | 047     | Code assujettissement taxe sur les salaires : valuer fixe "N"        | 1     | 371       | Text |
            header += "N";
            // | 048     | Zone réservée : 3 espaces                                            | 3     | 372-374   | Text |
            header += ' '.repeat(3);
            // | 051     | Code assujettissement PEEC / PEEC agricole : valeur fixe "N"         | 1     | 375       | Text |
            header += "N";
            // | 052     | Zone réservée : 1 espace                                             | 1     | 376       | Text |
            header += ' ';
            // | 053     | Zone réservée : 296 espaces                                          | 296   | 377-672   | Text |
            header += ' '.repeat(296);

            return header + '\n';
        }

        return { getCompanyHeaderLine, getEstablishmentHeaderLine };
    });
