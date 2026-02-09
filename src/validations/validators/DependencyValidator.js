/**
 * Validations des dépendances et tags
 */
export class DependencyValidator {

    /**
     * Compte combien de slots sont disponibles pour un tag donné
     */
    static countAvailableSlotsForTag(liste, codex, tag) {
        let totalSlots = 0;

        liste.formations.forEach(formation => {
            const formationDef = trouverFormation(codex, formation.formationId);
            if (!formationDef || !formationDef.FormationLimitationTag) return;

            // Si cette formation libère des slots pour ce tag
            if (formationDef.FormationLimitationTag[tag]) {
                totalSlots += formationDef.FormationLimitationTag[tag];
            }
        });

        return totalSlots;
    }

    /**
     * Compte combien de formations utilisent un tag donné
     */
    static countFormationsUsingTag(liste, codex, tag) {
        let count = 0;

        liste.formations.forEach(formation => {
            const formationDef = trouverFormation(codex, formation.formationId);
            if (!formationDef) return;

            // Chercher le groupe de cette formation
            for (const groupe of codex.groupes) {
                if (groupe.formations.some(f => f.id === formation.formationId)) {
                    // Si le groupe a ce LimitationTag
                    if (groupe.LimitationTag) {
                        if (Array.isArray(groupe.LimitationTag)) {
                            if (groupe.LimitationTag.includes(tag)) {
                                count++;
                            }
                        } else if (groupe.LimitationTag === tag) {
                            count++;
                        }
                    }
                    break;
                }
            }
        });

        return count;
    }

    /**
     * Vérifie si on peut ajouter une formation avec un LimitationTag
     */
    static validateLimitationTag(liste, codex, formationDef) {
        // Trouver le groupe de cette formation
        let groupe = null;
        for (const g of codex.groupes) {
            if (g.formations.some(f => f.id === formationDef.id)) {
                groupe = g;
                break;
            }
        }

        if (!groupe || !groupe.LimitationTag) {
            return { valid: true }; // Pas de limitation
        }

        const tags = Array.isArray(groupe.LimitationTag)
            ? groupe.LimitationTag
            : [groupe.LimitationTag];

        // Vérifier si au moins un tag est disponible
        let hasAvailableTag = false;
        let errorMessages = [];

        for (const tag of tags) {
            const availableSlots = this.countAvailableSlotsForTag(liste, codex, tag);
            const usedSlots = this.countFormationsUsingTag(liste, codex, tag);

            if (usedSlots < availableSlots) {
                hasAvailableTag = true;
                break;
            } else {
                errorMessages.push(`Tag "${tag}": ${usedSlots}/${availableSlots} slots utilisés`);
            }
        }

        if (!hasAvailableTag) {
            return {
                valid: false,
                error: `Cette formation nécessite un slot disponible (${tags.join(' ou ')}). ${errorMessages.join(', ')}`,
                type: 'LIMITATION_TAG'
            };
        }

        return { valid: true };
    }

    /**
     * Vérifie la limite max_par_tag d'un groupe
     */
    static validateMaxParTag(liste, codex, formationDef) {
        // Trouver le groupe de cette formation
        let groupe = null;
        for (const g of codex.groupes) {
            if (g.formations.some(f => f.id === formationDef.id)) {
                groupe = g;
                break;
            }
        }

        if (!groupe || !groupe.max_par_tag || !groupe.LimitationTag) {
            return { valid: true };
        }

        const tags = Array.isArray(groupe.LimitationTag)
            ? groupe.LimitationTag
            : [groupe.LimitationTag];

        // Pour chaque tag, vérifier qu'on ne dépasse pas max_par_tag
        for (const tag of tags) {
            const count = this.countFormationsUsingTag(liste, codex, tag);
            const availableSlots = this.countAvailableSlotsForTag(liste, codex, tag);

            if (count >= groupe.max_par_tag && count >= availableSlots) {
                return {
                    valid: false,
                    error: `Maximum ${groupe.max_par_tag} formations de ce type par cadre`,
                    type: 'MAX_PAR_TAG'
                };
            }
        }

        return { valid: true };
    }
}

function trouverFormation(codex, formationId) {
    for (const groupe of codex.groupes) {
        const formation = groupe.formations.find(f => f.id === formationId);
        if (formation) return formation;
    }
    return null;
}