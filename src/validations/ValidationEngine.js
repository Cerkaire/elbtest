import { FormationValidator } from './validators/FormationValidator';
import { AmeliorationValidator } from './validators/AmeliorationValidator';
import { RareValidator } from './validators/RareValidator';
import { DependencyValidator } from './validators/DependencyValidator';
/**
 * Moteur de validation central
 */
export class ValidationEngine {

    constructor(codex) {
        this.codex = codex;
    }

    /**
     * Valide toute la liste
     */
    validateListe(liste) {
        const errors = [];
        const warnings = [];
        const infos = [];

        const pointsTotal = this.calculerPointsTotal(liste);

        // 1. Validation quota rare
        const rareResult = RareValidator.validateQuotaRare(liste, this.codex, pointsTotal);
        if (!rareResult.valid) {
            errors.push(rareResult);
        } else if (rareResult.info) {
            infos.push(rareResult);
        }

        // 2. Validation min formations par groupe
        this.codex.groupes.forEach(groupe => {
            const result = FormationValidator.validateMinFormations(liste, this.codex, groupe);
            if (!result.valid) {
                if (result.blocking) {
                    errors.push(result);
                } else {
                    warnings.push(result);
                }
            }
        });

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            infos
        };
    }

    /**
     * Vérifie si on peut ajouter une formation
     */
    canAddFormation(liste, formationId) {
        const formationDef = this.findFormation(formationId);
        if (!formationDef) return { valid: false, error: 'Formation introuvable' };

        // 1. Vérifier limite formation
        const limiteResult = FormationValidator.validateFormationLimite(liste, formationDef);
        if (!limiteResult.valid) return limiteResult;

        // ✅ 2. Vérifier LimitationTag
        const tagResult = DependencyValidator.validateLimitationTag(liste, this.codex, formationDef);
        if (!tagResult.valid) return tagResult;

        // ✅ 3. Vérifier max_par_tag
        const maxTagResult = DependencyValidator.validateMaxParTag(liste, this.codex, formationDef);
        if (!maxTagResult.valid) return maxTagResult;

        return { valid: true };
    }

    /**
     * Vérifie si on peut ajouter une amélioration
     */
    canAddAmelioration(liste, formation, ameliorationId) {
        const formationDef = this.findFormation(formation.formationId);
        const ameliorationDef = this.codex.ameliorations.find(a => a.id === ameliorationId);

        if (!ameliorationDef) return { valid: false, error: 'Amélioration introuvable' };

        // Limite par formation
        const limiteFormationResult = AmeliorationValidator.validateLimiteFormation(formation, ameliorationDef);
        if (!limiteFormationResult.valid) return limiteFormationResult;

        // Limite globale
        const limiteGlobaleResult = AmeliorationValidator.validateLimiteGlobale(liste, ameliorationDef);
        if (!limiteGlobaleResult.valid) return limiteGlobaleResult;

        // Unicité
        const uniqueResult = AmeliorationValidator.validateUnique(formation, ameliorationDef);
        if (!uniqueResult.valid) return uniqueResult;

        // Limite d'options de la formation
        const limiteOptionsResult = FormationValidator.validateLimiteOptionFormation(formation, formationDef);
        if (!limiteOptionsResult.valid) return limiteOptionsResult;

        return { valid: true };
    }

    /**
     * Helpers
     */
    findFormation(formationId) {
        for (const groupe of this.codex.groupes) {
            const formation = groupe.formations.find(f => f.id === formationId);
            if (formation) return formation;
        }
        return null;
    }

    calculerPointsTotal(liste) {
        return liste.formations.reduce((total, formation) => {
            let cout = formation.cout;

            // Améliorations
            formation.ameliorations.forEach(amelio => {
                const amelioDef = this.codex.ameliorations.find(a => a.id === amelio.ameliorationId);
                if (amelioDef) cout += amelioDef.cout;
            });

            return total + cout;
        }, 0);
    }
}