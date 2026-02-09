import React, { createContext, useContext, useState, useEffect } from 'react';
import { ValidationEngine } from '../validations';

const ArmyListContext = createContext();

export function ArmyListProvider({ children, codex }) {
    const [liste, setListe] = useState({
        nom: "Nouvelle liste",
        codexId: codex?.codex?.id || '',
        formations: []
    });

    // ✅ Créer le moteur de validation
    const [validator] = useState(() => new ValidationEngine(codex));

    // ✅ État de validation
    const [validation, setValidation] = useState({
        valid: true,
        errors: [],
        warnings: [],
        infos: []
    });

    // ✅ Valider la liste à chaque changement
    useEffect(() => {
        const result = validator.validateListe(liste);
        setValidation(result);
    }, [liste, validator]);

    // ========== AJOUTER UNE FORMATION ==========
    const ajouterFormation = (formationId, varianteId = null, unitesCustom = null) => {
        // ✅ Vérifier si on peut ajouter
        const canAdd = validator.canAddFormation(liste, formationId);
        if (!canAdd.valid) {
            alert(canAdd.error);
            return;
        }

        const formationDef = trouverFormation(codex, formationId);
        if (!formationDef) return;

        // Trouver la variante si spécifiée
        let cout = formationDef.cout;
        let unites = unitesCustom || formationDef.unites || [];
        let varianteName = null;

        if (varianteId && formationDef.variantes) {
            const variante = formationDef.variantes.find(v => v.id === varianteId);

            if (variante) {
                cout = variante.cout;
                varianteName = variante.name;

                // ✅ Support nombre_exact (pour choix unique)
                if (variante.nombre_exact) {
                    unites = formationDef.unites.map(unite => ({
                        ...unite,
                        nombre: variante.nombre_exact
                    }));
                }
                // ✅ Support multiplicateur (pour variantes de taille)
                else if (variante.multiplicateur) {
                    unites = formationDef.unites.map(unite => ({
                        ...unite,
                        nombre: Math.round(unite.nombre * variante.multiplicateur)
                    }));
                }
                // ✅ Support ajout_unites (pour Vespids)
                else if (variante.ajout_unites) {
                    unites = formationDef.unites.map(unite => ({
                        ...unite,
                        nombre: unite.nombre + variante.ajout_unites
                    }));
                }
            }
        }

        const nouvelleFormation = {
            id: genererID(),
            formationId: formationId,
            nom: formationDef.name,
            varianteId: varianteId,
            varianteName: varianteName,
            cout: cout,
            unites: unites.map(unite => ({
                id: genererID(),
                uniteId: unite.id,
                nom: unite.name || unite.nom,
                nombre: unite.nombre,
                options: unite.options ? unite.options.map(opt => ({
                    optionId: opt.id,
                    nom: opt.name,
                    itemSelectionne: null,
                    itemsMultiples: opt.multiple ? [] : null
                })) : []
            })),
            ameliorations: []
        };

        setListe(prev => ({
            ...prev,
            formations: [...prev.formations, nouvelleFormation]
        }));
    };

    // ========== SUPPRIMER UNE FORMATION ==========
    const supprimerFormation = (formationId) => {
        setListe(prev => ({
            ...prev,
            formations: prev.formations.filter(f => f.id !== formationId)
        }));
    };

    // ========== SÉLECTIONNER UN ITEM ==========
    const selectionnerItem = (formationId, uniteId, optionId, itemId) => {
        setListe(prev => ({
            ...prev,
            formations: prev.formations.map(formation => {
                if (formation.id !== formationId) return formation;

                return {
                    ...formation,
                    unites: formation.unites.map(unite => {
                        if (unite.id !== uniteId) return unite;

                        return {
                            ...unite,
                            options: unite.options.map(option => {
                                if (option.optionId !== optionId) return option;

                                return {
                                    ...option,
                                    itemSelectionne: itemId
                                };
                            })
                        };
                    })
                };
            })
        }));
    };

    // ========== REMPLACER DES UNITÉS ==========
    const ajouterRemplacementUnite = (formationId, ameliorationId, quantite) => {
        const ameliorationDef = codex.ameliorations.find(a => a.id === ameliorationId);
        if (!ameliorationDef || !ameliorationDef.type_remplacement) return;

        const config = ameliorationDef.type_remplacement;

        setListe(prev => ({
            ...prev,
            formations: prev.formations.map(formation => {
                if (formation.id !== formationId) return formation;

                // Compter combien d'unités remplaçables sont disponibles
                const unitesRemplacables = formation.unites.filter(unite =>
                    config.remplace_unites.includes(unite.uniteId) && !unite.remplace
                );

                if (unitesRemplacables.length === 0) {
                    alert('Aucune unité disponible pour le remplacement');
                    return formation;
                }

                if (quantite > unitesRemplacables.length) {
                    alert(`Maximum ${unitesRemplacables.length} unité(s) remplaçable(s)`);
                    return formation;
                }

                // Créer les nouvelles unités de remplacement
                const nouvelles_unites = [];
                let remplacees = 0;

                formation.unites.forEach(unite => {
                    // Si c'est une unité à remplacer et qu'on n'a pas atteint la quantité
                    if (
                        remplacees < quantite &&
                        config.remplace_unites.includes(unite.uniteId) &&
                        !unite.remplace
                    ) {
                        // Marquer comme remplacée
                        nouvelles_unites.push({
                            ...unite,
                            remplace: true,
                            remplace_par: ameliorationId
                        });

                        // Ajouter l'unité de remplacement
                        nouvelles_unites.push({
                            id: genererID(),
                            uniteId: config.par_unite,
                            nom: ameliorationDef.unites[0].name,
                            nombre: ameliorationDef.unites[0].nombre,
                            options: [],
                            est_remplacement: true,
                            remplacement_de: unite.id
                        });

                        remplacees++;
                    } else {
                        nouvelles_unites.push(unite);
                    }
                });

                return {
                    ...formation,
                    unites: nouvelles_unites,
                    ameliorations: [...formation.ameliorations, {
                        id: genererID(),
                        ameliorationId: ameliorationId,
                        quantite: quantite,
                        type: 'remplacement'
                    }]
                };
            })
        }));
    };

    // ========== AJOUTER UNE AMÉLIORATION ==========
    const ajouterAmelioration = (formationId, ameliorationId, quantite = 1) => {
        const formation = liste.formations.find(f => f.id === formationId);
        if (!formation) return;

        const ameliorationDef = codex.ameliorations.find(a => a.id === ameliorationId);
        if (!ameliorationDef) return;

        // ✅ Vérifier si on peut ajouter
        const canAdd = validator.canAddAmelioration(liste, formation, ameliorationId);
        if (!canAdd.valid) {
            alert(canAdd.error);
            return;
        }

        // ✅ Vérifier si c'est un remplacement
        if (ameliorationDef.type_remplacement) {
            return ajouterRemplacementUnite(formationId, ameliorationId, quantite);
        }

        // Amélioration normale
        setListe(prev => ({
            ...prev,
            formations: prev.formations.map(f => {
                if (f.id !== formationId) return f;

                return {
                    ...f,
                    ameliorations: [...f.ameliorations, {
                        id: genererID(),
                        ameliorationId: ameliorationId,
                        quantite: quantite
                    }]
                };
            })
        }));
    };

    // ========== SUPPRIMER UNE AMÉLIORATION ==========
    const supprimerAmelioration = (formationId, ameliorationInstanceId) => {
        setListe(prev => ({
            ...prev,
            formations: prev.formations.map(formation => {
                if (formation.id !== formationId) return formation;

                const amelio = formation.ameliorations.find(a => a.id === ameliorationInstanceId);
                if (!amelio) return formation;

                // ✅ Si c'est un remplacement, restaurer les unités originales
                if (amelio.type === 'remplacement') {
                    const nouvelles_unites = formation.unites.filter(unite => {
                        // Supprimer les unités de remplacement
                        if (unite.est_remplacement &&
                            formation.ameliorations.find(a => a.id === ameliorationInstanceId)) {
                            return false;
                        }
                        return true;
                    }).map(unite => {
                        // Restaurer les unités remplacées
                        if (unite.remplace && unite.remplace_par === amelio.ameliorationId) {
                            const { remplace, remplace_par, ...uniteRestauree } = unite;
                            return uniteRestauree;
                        }
                        return unite;
                    });

                    return {
                        ...formation,
                        unites: nouvelles_unites,
                        ameliorations: formation.ameliorations.filter(a => a.id !== ameliorationInstanceId)
                    };
                }

                // Amélioration normale
                return {
                    ...formation,
                    ameliorations: formation.ameliorations.filter(a => a.id !== ameliorationInstanceId)
                };
            })
        }));
    };

    // ========== CALCULER LE COÛT TOTAL ==========
    const calculerCoutTotal = () => {
        return liste.formations.reduce((total, formation) => {
            let coutFormation = formation.cout;

            // Ajouter coût des items
            formation.unites?.forEach(unite => {
                unite.options?.forEach(option => {
                    if (option.itemSelectionne) {
                        const itemDef = trouverItem(codex, formation.formationId, unite.uniteId, option.optionId, option.itemSelectionne);
                        if (itemDef) coutFormation += itemDef.cout;
                    }
                });
            });

            // Ajouter coût des améliorations
            formation.ameliorations?.forEach(amelioration => {
                const ameliorationDef = codex.ameliorations.find(a => a.id === amelioration.ameliorationId);
                if (ameliorationDef) {
                    const quantite = amelioration.quantite || 1;
                    coutFormation += ameliorationDef.cout * quantite;
                }
            });

            return total + coutFormation;
        }, 0);
    };

    return (
        <ArmyListContext.Provider value={{
            liste,
            validation,
            validator,
            ajouterFormation,
            supprimerFormation,
            selectionnerItem,
            ajouterAmelioration,
            supprimerAmelioration,
            calculerCoutTotal
        }}>
            {children}
        </ArmyListContext.Provider>
    );
}

export const useArmyList = () => useContext(ArmyListContext);

// ========== HELPERS ==========

function genererID() {
    return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function trouverFormation(codex, formationId) {
    if (!codex || !codex.groupes) return null;

    for (const groupe of codex.groupes) {
        const formation = groupe.formations.find(f => f.id === formationId);
        if (formation) return formation;
    }
    return null;
}

function trouverItem(codex, formationId, uniteId, optionId, itemId) {
    const formationDef = trouverFormation(codex, formationId);
    if (!formationDef) return null;

    const uniteDef = formationDef.unites?.find(u => u.id === uniteId);
    if (!uniteDef || !uniteDef.options) return null;

    const optionDef = uniteDef.options.find(o => o.id === optionId);
    if (!optionDef || !optionDef.items) return null;

    return optionDef.items.find(i => i.id === itemId);
}