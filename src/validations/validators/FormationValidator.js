/**
 * Validations au niveau des formations
 */
export class FormationValidator {

    /**
     * Vérifie la limite globale d'une formation
     */
    static validateFormationLimite(liste, formationDef) {
        if (!formationDef.FormationLimite) return { valid: true };

        const count = liste.formations.filter(
            f => f.formationId === formationDef.id
        ).length;

        if (count >= formationDef.FormationLimite) {
            return {
                valid: false,
                error: `Maximum ${formationDef.FormationLimite} ${formationDef.name} autorisé(es)`,
                type: 'FORMATION_LIMITE'
            };
        }

        return { valid: true };
    }

    /**
     * Vérifie le nombre min de formations dans un groupe
     */
    static validateMinFormations(liste, codex, groupe) {
        if (!groupe.min_formations) return { valid: true };

        const count = liste.formations.filter(f => {
            return groupe.formations.some(gf => gf.id === f.formationId);
        }).length;

        if (count < groupe.min_formations) {
            return {
                valid: false,
                error: `Au moins ${groupe.min_formations} formation(s) de type "${groupe.name}" requise(s)`,
                type: 'MIN_FORMATIONS',
                blocking: true  // Bloque la validation de la liste
            };
        }

        return { valid: true };
    }

    /**
     * Vérifie le nombre max d'améliorations d'une formation
     */
    static validateLimiteOptionFormation(formation, formationDef) {
        if (!formationDef.limiteOptionFormation) return { valid: true };

        // Compte les améliorations qui comptent comme options
        const count = formation.ameliorations.filter(amelio => {
            // TODO: vérifier amelioDef.IsNotOption
            return true;
        }).length;

        if (count >= formationDef.limiteOptionFormation) {
            return {
                valid: false,
                error: `Maximum ${formationDef.limiteOptionFormation} amélioration(s) pour cette formation`,
                type: 'LIMITE_OPTIONS'
            };
        }

        return { valid: true };
    }
}