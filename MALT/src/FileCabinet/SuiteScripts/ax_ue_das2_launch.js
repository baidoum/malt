/**
 * Script user event du custom record DAS2 (customrecord_das2).
 *
 * Lorsque "Lancer l'export" (custrecord_das2_launch) est coché, déclenche le map/reduce d'export DAS2
 * (ax_mp_das2_export.js) en lui transmettant la période demandée et l'id de l'enregistrement DAS2, puis
 * décoche la case pour éviter un nouveau déclenchement.
 *
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(['N/log', 'N/record', 'N/task'],
    /**
     * @param {typeof import('N/log')} log
     * @param {typeof import('N/record')} record
     * @param {typeof import('N/task')} task
     * @returns
     */
    (log, record, task) => {

        // Script/déploiement du map/reduce d'export DAS2.
        const MAP_REDUCE_SCRIPT_ID = 'customscript_ax_mp_das2_export';
        const MAP_REDUCE_DEPLOYMENT_ID = 'customdeploy_ax_mp_das2_export'; // TODO: remplacer par l'id réel une fois le script déployé.

        /**
         * @param {import('N/types').EntryPoints.UserEvent.afterSubmitContext} context
         * @since 2015.2
         */
        const afterSubmit = (context) => {
            if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.EDIT) {
                return;
            }

            const newRecord = context.newRecord;
            const launch = newRecord.getValue({ fieldId: 'custrecord_das2_launch' });
            if (!launch) {
                return;
            }

            const dateFrom = newRecord.getValue({ fieldId: 'custrecord_das2_date_from' });
            const dateTo = newRecord.getValue({ fieldId: 'custrecord_das2_date_to' });

            try {
                task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: MAP_REDUCE_SCRIPT_ID,
                    deploymentId: MAP_REDUCE_DEPLOYMENT_ID,
                    params: {
                        custscript_ax_das2_date_from: dateFrom,
                        custscript_ax_das2_date_to: dateTo,
                        custscript_ax_das2_record_id: newRecord.id
                    }
                }).submit();
            }
            catch (e) {
                log.error({
                    title: 'Impossible de lancer l\'export DAS2',
                    details: e
                });
            }
            finally {
                // Décocher la case, y compris en cas d'échec du lancement, pour éviter de relancer
                // automatiquement l'export à la prochaine sauvegarde de l'enregistrement.
                record.submitFields({
                    type: newRecord.type,
                    id: newRecord.id,
                    values: { custrecord_das2_launch: false }
                });
            }
        }

        return { afterSubmit };
    });
