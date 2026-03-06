/**
 * Validations au niveau des améliorations
 */
export class AmeliorationValidator {

    /**
     * Vérifie la limite globale d'une amélioration
     */
    static validateLimiteGlobale(liste, ameliorationDef) {
        if (!ameliorationDef.limiteOptionGlobal) return { valid: true };

        let count = 0;
        liste.formations.forEach(formation => {
            count += formation.ameliorations.filter(
                a => a.ameliorationId === ameliorationDef.id
            ).length;
        });

        if (count >= ameliorationDef.limiteOptionGlobal) {
            return {
                valid: false,
                error: `Maximum ${ameliorationDef.limiteOptionGlobal} ${ameliorationDef.name} dans l'armée`,
                type: 'LIMITE_GLOBALE'
            };
        }

        return { valid: true };
    }

    /**
     * Vérifie la limite par formation
     */
    static validateLimiteFormation(formation, ameliorationDef) {
        if (!ameliorationDef.limit) return { valid: true };

        const count = formation.ameliorations.filter(
            a => a.ameliorationId === ameliorationDef.id
        ).length;

        if (count >= ameliorationDef.limit) {
            return {
                valid: false,
                error: `Maximum ${ameliorationDef.limit} ${ameliorationDef.name} par formation`,
                type: 'LIMITE_FORMATION'
            };
        }

        return { valid: true };
    }

    /**
     * Vérifie l'unicité dans une formation
     */
    static validateUnique(formation, ameliorationDef, codex) {
        if (!ameliorationDef.unique) return { valid: true };

        const hasConflict = formation.ameliorations.some(amelio => {
            if (amelio.ameliorationId === ameliorationDef.id) return false;
            const otherDef = codex.ameliorations.find(a => a.id === amelio.ameliorationId);
            return otherDef && otherDef.unique === ameliorationDef.unique;
        });

        if (hasConflict) {
            return {
                valid: false,
                error: `Vous avez déjà une amélioration de type "${ameliorationDef.unique}"`,
                type: 'UNIQUE'
            };
        }

        return { valid: true };
    }

    /**
     * Vérifie les min/max
     */
    static validateMinMax(formation, ameliorationDef, quantite) {
        if (ameliorationDef.min !== undefined && quantite < ameliorationDef.min) {
            return {
                valid: false,
                error: `Minimum ${ameliorationDef.min} requis`,
                type: 'MIN'
            };
        }

        if (ameliorationDef.max !== undefined && quantite > ameliorationDef.max) {
            return {
                valid: false,
                error: `Maximum ${ameliorationDef.max} autorisé`,
                type: 'MAX'
            };
        }

        return { valid: true };
    }
}