/**
 * Script scheduled qui crée les enregistrements customrecord_das2_logs à partir de la file d'erreurs de
 * validation générée par le map/reduce d'export DAS2 (ax_mp_das2_export.js).
 *
 * Ce script tourne séparément du map/reduce afin de ne pas consommer sa gouvernance : celui-ci se
 * contente d'écrire un fichier JSON {recordId, errors[]} et de déclencher ce script. Si la gouvernance
 * vient à manquer en cours de traitement, le script se replanifie lui-même à partir de l'index où il
 * s'est arrêté.
 *
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */

define(['N/file', 'N/log', 'N/record', 'N/runtime', 'N/task'],
    /**
     * @param {typeof import('N/file')} file
     * @param {typeof import('N/log')} log
     * @param {typeof import('N/record')} record
     * @param {typeof import('N/runtime')} runtime
     * @param {typeof import('N/task')} task
     * @returns
     */
    (file, log, record, runtime, task) => {

        const QUEUE_FILE_ID_PARAM = 'custscript_ax_das2log_queue_file_id';
        const START_INDEX_PARAM = 'custscript_ax_das2log_start_index';

        // Script/déploiement de ce script lui-même, utilisés pour se replanifier si la gouvernance manque.
        const SCRIPT_ID = 'customscript_ax_ss_das2_logs'; // TODO: à adapter si l'id diffère au déploiement.
        const DEPLOYMENT_ID = 'customdeploy_ax_ss_das2_logs'; // TODO: remplacer par l'id réel une fois le script déployé.

        // Seuil de gouvernance restante en-deça duquel on se replanifie plutôt que de risquer un échec.
        const MIN_REMAINING_USAGE = 100;

        /**
         * @param {import('N/types').EntryPoints.Scheduled.executeContext} context
         * @since 2015.2
         */
        const execute = (context) => {
            const scriptObj = runtime.getCurrentScript();
            const queueFileId = scriptObj.getParameter({ name: QUEUE_FILE_ID_PARAM });
            const startIndex = Number(scriptObj.getParameter({ name: START_INDEX_PARAM }) || 0);

            if (!queueFileId) {
                log.error({
                    title: 'Paramètre manquant',
                    details: `${QUEUE_FILE_ID_PARAM} est requis.`
                });
                return;
            }

            const queueFile = file.load({ id: queueFileId });
            const queue = JSON.parse(queueFile.getContents());
            const errors = queue.errors || [];
            const recordId = queue.recordId;

            let i = startIndex;
            for (; i < errors.length; i++) {
                if (scriptObj.getRemainingUsage() < MIN_REMAINING_USAGE) {
                    task.create({
                        taskType: task.TaskType.SCHEDULED_SCRIPT,
                        scriptId: SCRIPT_ID,
                        deploymentId: DEPLOYMENT_ID,
                        params: {
                            [QUEUE_FILE_ID_PARAM]: queueFileId,
                            [START_INDEX_PARAM]: i
                        }
                    }).submit();
                    return;
                }

                record.create({ type: 'customrecord_das2_logs' })
                    .setValue({ fieldId: 'custrecord_das2log_das2', value: recordId })
                    .setValue({ fieldId: 'custrecord_das2log_error', value: errors[i] })
                    .save();
            }

            // Tous les messages ont été enregistrés : la file d'attente n'est plus nécessaire.
            file.delete({ id: queueFileId });
        }

        return { execute };
    });
