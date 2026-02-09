/**
 * Validations des formations/options rares (quota 1/3)
 */
export class RareValidator {

    /**
     * Calcule les points de formations rares
     */
    static calculerPointsRares(liste, codex) {
        let pointsRares = 0;

        liste.formations.forEach(formation => {
            const formationDef = trouverFormation(codex, formation.formationId);
            if (!formationDef) return;

            if (formationDef.rare) {
                pointsRares += formation.cout;

                // Ajouter coût des améliorations rares
                formation.ameliorations.forEach(amelio => {
                    const amelioDef = codex.ameliorations.find(a => a.id === amelio.ameliorationId);
                    if (amelioDef?.rare) {
                        pointsRares += amelioDef.cout;
                    }
                });
            }
        });

        return pointsRares;
    }

    /**
     * Vérifie le quota 1/3
     */
    static validateQuotaRare(liste, codex, pointsTotal) {
        const ratio = codex.codex.regles_speciales?.max_formations_rares_ratio || 0.33;
        const maxPointsRares = Math.floor(pointsTotal * ratio);

        const pointsRares = this.calculerPointsRares(liste, codex);

        if (pointsRares > maxPointsRares) {
            return {
                valid: false,
                error: `Formations rares : ${pointsRares} pts (max ${maxPointsRares} pts soit 1/3 de ${pointsTotal} pts)`,
                type: 'QUOTA_RARE',
                blocking: true
            };
        }

        return {
            valid: true,
            info: `Formations rares : ${pointsRares} / ${maxPointsRares} pts`
        };
    }
}

function trouverFormation(codex, formationId) {
    for (const groupe of codex.groupes) {
        const formation = groupe.formations.find(f => f.id === formationId);
        if (formation) return formation;
    }
    return null;
}