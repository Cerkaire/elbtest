import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { ValidationEngine } from '../validations';
import { saveListe, loadAllListes } from '../services/listStorageService';

const ArmyListContext = createContext();

export function ArmyListProvider({ children, codex, initialListId }) {
    const [liste, setListe] = useState({
        id: genererID(),
        nom: "Nouvelle liste",
        codexId: codex?.codex?.id || '',
        formations: [],
        dateCreation: new Date().toISOString(),
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

    const [notification, setNotification] = useState({ open: false, message: '' });
    const showError = (message) => setNotification({ open: true, message });

    // ✅ Valider la liste à chaque changement
    useEffect(() => {
        const result = validator.validateListe(liste);
        setValidation(result);
    }, [liste, validator]);

    // ========== AJOUTER UNE FORMATION ==========
    const ajouterFormation = (formationId, varianteId = null, unitesCustom = null, coutOverride = null) => {
        // ✅ Vérifier si on peut ajouter
        const canAdd = validator.canAddFormation(liste, formationId);
        if (!canAdd.valid) {
            showError(canAdd.error);
            return;
        }

        const formationDef = trouverFormation(codex, formationId);
        if (!formationDef) return;

        // Trouver la variante si spécifiée
        let cout = coutOverride !== null ? coutOverride : formationDef.cout;
        // Si la formation a des unités fixes ET une composition, combiner les deux
        const unitesFixees = formationDef.unites || [];
        let unites = unitesCustom !== null
            ? (unitesFixees.length > 0 ? [...unitesFixees, ...unitesCustom] : unitesCustom)
            : unitesFixees;
        let varianteName = null;

        // Calculer le coût pour les compositions personnalisées (si pas de coutOverride)
        if (coutOverride === null && unitesCustom && formationDef.composition_personnalisee) {
            const options = formationDef.composition_personnalisee.options || [];
            cout = unitesCustom.reduce((total, unite) => {
                const option = options.find(o => o.unitId === (unite.uniteId || unite.id));
                if (option && option.cout) {
                    return total + option.cout * (unite.nombre || 1);
                }
                return total;
            }, formationDef.cout);
        }

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
            unites: unites.flatMap(unite => {
                const hasOptions = (unite.options || []).length > 0;
                const nombre = unite.nombre || 1;

                if (hasOptions && nombre > 1) {
                    // Éclater en entrées individuelles pour gérer l'équipement séparément
                    return Array.from({ length: nombre }, (_, i) => ({
                        id: genererID(),
                        uniteId: unite.uniteId || unite.id,
                        nom: unite.name || unite.nom,
                        nombre: 1,
                        instanceIndex: i + 1,
                        instanceTotal: nombre,
                        ...(unite.tags?.length && { tags: unite.tags }),
                        options: unite.options.map(opt => ({
                            optionId: opt.id,
                            nom: opt.name,
                            itemSelectionne: null,
                            itemsMultiples: opt.multiple ? [] : null
                        }))
                    }));
                }

                return [{
                    id: genererID(),
                    uniteId: unite.uniteId || unite.id,
                    nom: unite.name || unite.nom,
                    nombre: nombre,
                    ...(unite.tags?.length && { tags: unite.tags }),
                    options: (unite.options || []).map(opt => ({
                        optionId: opt.id,
                        nom: opt.name,
                        itemSelectionne: null,
                        itemsMultiples: opt.multiple ? [] : null
                    }))
                }];
            }),
            ameliorations: []
        };

        setListe(prev => ({
            ...prev,
            formations: [...prev.formations, nouvelleFormation]
        }));
    };

    // ========== DUPLIQUER UNE FORMATION ==========
    const dupliquerFormation = (formationId) => {
        setListe(prev => {
            const idx = prev.formations.findIndex(f => f.id === formationId);
            if (idx === -1) return prev;
            const original = prev.formations[idx];
            const copie = JSON.parse(JSON.stringify(original));
            copie.id = genererID();
            copie.unites = copie.unites.map(u => ({ ...u, id: genererID() }));
            copie.ameliorations = copie.ameliorations.map(a => ({ ...a, id: genererID() }));
            const formations = [...prev.formations];
            formations.splice(idx + 1, 0, copie);
            return { ...prev, formations };
        });
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
    const ajouterRemplacementUnite = (formationId, ameliorationId, quantiteOuDistribution) => {
        const ameliorationDef = codex.ameliorations.find(a => a.id === ameliorationId);
        if (!ameliorationDef || !ameliorationDef.type_remplacement) return;

        const config = ameliorationDef.type_remplacement;
        const tailleLot = config.taille_lot || 1;
        const isDistribution = typeof quantiteOuDistribution === 'object';
        // quantiteOuDistribution est en lots, on calcule le nombre réel d'unités à remplacer
        const quantiteLots = isDistribution
            ? Object.values(quantiteOuDistribution).reduce((sum, v) => sum + v, 0)
            : quantiteOuDistribution;
        const quantiteReelle = quantiteLots * tailleLot;

        setListe(prev => ({
            ...prev,
            formations: prev.formations.map(formation => {
                if (formation.id !== formationId) return formation;

                // Compter combien d'unités individuelles remplaçables sont disponibles
                const totalRemplacables = formation.unites.reduce((total, unite) => {
                    if (config.remplace_unites.includes(unite.uniteId) && !unite.remplace) {
                        return total + (unite.nombre || 1);
                    }
                    return total;
                }, 0);

                if (totalRemplacables === 0) {
                    showError('Aucune unité disponible pour le remplacement');
                    return formation;
                }

                if (quantiteReelle > totalRemplacables) {
                    showError(`Maximum ${totalRemplacables} unité(s) remplaçable(s)`);
                    return formation;
                }

                // Créer les nouvelles unités de remplacement en tenant compte du nombre
                const nouvelles_unites = [];

                if (isDistribution) {
                    // Mode distribution : remplacer exactement le nombre demandé par type
                    // Les valeurs de distribution sont en lots, on multiplie par taille_lot
                    const restantParType = {};
                    for (const [key, val] of Object.entries(quantiteOuDistribution)) {
                        restantParType[key] = val * tailleLot;
                    }

                    formation.unites.forEach(unite => {
                        const demandeePourType = restantParType[unite.uniteId] || 0;
                        if (
                            demandeePourType > 0 &&
                            config.remplace_unites.includes(unite.uniteId) &&
                            !unite.remplace
                        ) {
                            const nombreUnite = unite.nombre || 1;
                            const aRemplacer = Math.min(demandeePourType, nombreUnite);
                            const restant = nombreUnite - aRemplacer;

                            if (restant > 0) {
                                nouvelles_unites.push({
                                    ...unite,
                                    nombre: restant
                                });
                            }

                            nouvelles_unites.push({
                                ...unite,
                                id: restant > 0 ? genererID() : unite.id,
                                nombre: aRemplacer,
                                remplace: true,
                                remplace_par: ameliorationId
                            });

                            nouvelles_unites.push({
                                id: genererID(),
                                uniteId: config.par_unite,
                                nom: ameliorationDef.unites[0].name,
                                nombre: aRemplacer,
                                options: [],
                                est_remplacement: true,
                                remplacement_de: unite.id,
                                remplace_par: ameliorationId
                            });

                            restantParType[unite.uniteId] -= aRemplacer;
                        } else {
                            nouvelles_unites.push(unite);
                        }
                    });
                } else {
                    // Mode simple : comportement original (quantité en lots → unités réelles)
                    let restantARemplacer = quantiteReelle;

                    formation.unites.forEach(unite => {
                        if (
                            restantARemplacer > 0 &&
                            config.remplace_unites.includes(unite.uniteId) &&
                            !unite.remplace
                        ) {
                            const nombreUnite = unite.nombre || 1;
                            const aRemplacer = Math.min(restantARemplacer, nombreUnite);
                            const restant = nombreUnite - aRemplacer;

                            if (restant > 0) {
                                nouvelles_unites.push({
                                    ...unite,
                                    nombre: restant
                                });
                            }

                            nouvelles_unites.push({
                                ...unite,
                                id: restant > 0 ? genererID() : unite.id,
                                nombre: aRemplacer,
                                remplace: true,
                                remplace_par: ameliorationId
                            });

                            nouvelles_unites.push({
                                id: genererID(),
                                uniteId: config.par_unite,
                                nom: ameliorationDef.unites[0].name,
                                nombre: aRemplacer,
                                options: [],
                                est_remplacement: true,
                                remplacement_de: unite.id,
                                remplace_par: ameliorationId
                            });

                            restantARemplacer -= aRemplacer;
                        } else {
                            nouvelles_unites.push(unite);
                        }
                    });
                }

                return {
                    ...formation,
                    unites: nouvelles_unites,
                    ameliorations: [...formation.ameliorations, {
                        id: genererID(),
                        ameliorationId: ameliorationId,
                        quantite: quantiteLots,
                        type: 'remplacement'
                    }]
                };
            })
        }));
    };

    // ========== AJOUTER UNE AMÉLIORATION ==========
    const ajouterAmelioration = (formationId, ameliorationId, quantiteOuDistribution = 1, choixId = null, choixName = null, unitesComposition = null) => {
        const formation = liste.formations.find(f => f.id === formationId);
        if (!formation) return;

        const ameliorationDef = codex.ameliorations.find(a => a.id === ameliorationId);
        if (!ameliorationDef) return;

        // ✅ Vérifier si on peut ajouter
        const canAdd = validator.canAddAmelioration(liste, formation, ameliorationId);
        if (!canAdd.valid) {
            showError(canAdd.error);
            return;
        }

        // ✅ Valider la limite globale du choix sélectionné
        if (choixId && ameliorationDef.choix) {
            const choixDef = ameliorationDef.choix.find(c => c.id === choixId);
            if (choixDef?.limiteOptionGlobal) {
                const count = liste.formations.reduce((total, f) =>
                    total + f.ameliorations.filter(a =>
                        a.ameliorationId === ameliorationId && a.choixId === choixId
                    ).length, 0
                );
                if (count >= choixDef.limiteOptionGlobal) {
                    showError(`Maximum ${choixDef.limiteOptionGlobal} "${choixDef.name}" dans l'armée`);
                    return;
                }
            }
        }

        // ✅ Vérifier si c'est un remplacement
        if (ameliorationDef.type_remplacement) {
            return ajouterRemplacementUnite(formationId, ameliorationId, quantiteOuDistribution);
        }

        // Amélioration normale
        const quantite = typeof quantiteOuDistribution === 'object' ? 1 : quantiteOuDistribution;
        setListe(prev => ({
            ...prev,
            formations: prev.formations.map(f => {
                if (f.id !== formationId) return f;

                return {
                    ...f,
                    ameliorations: [...f.ameliorations, {
                        id: genererID(),
                        ameliorationId: ameliorationId,
                        quantite: quantite,
                        ...(choixId && { choixId, choixName }),
                        ...(unitesComposition?.length && { unitesComposition })
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
                    // 1. Supprimer les unités de remplacement et restaurer les remplacées
                    const unitesRestaurees = formation.unites.filter(unite => {
                        // Supprimer les unités de remplacement liées à cette amélioration
                        if (unite.est_remplacement && unite.remplace_par === amelio.ameliorationId) {
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

                    // 2. Re-fusionner les entrées du même type d'unité qui ont été divisées
                    const nouvelles_unites = [];
                    unitesRestaurees.forEach(unite => {
                        const existante = nouvelles_unites.find(u =>
                            u.uniteId === unite.uniteId &&
                            !u.remplace && !unite.remplace &&
                            !u.est_remplacement && !unite.est_remplacement
                        );
                        if (existante) {
                            existante.nombre = (existante.nombre || 1) + (unite.nombre || 1);
                        } else {
                            nouvelles_unites.push({ ...unite });
                        }
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
                    if (ameliorationDef.cout_par_unite) {
                        const quantite = amelioration.quantite || 1;
                        coutFormation += ameliorationDef.cout * quantite;
                    } else {
                        coutFormation += ameliorationDef.cout;
                    }
                }
            });

            return total + coutFormation;
        }, 0);
    };

    // ========== CHARGER UNE LISTE SAUVEGARDÉE ==========
    const chargerListe = useCallback((savedList) => {
        setListe({
            id: savedList.id,
            nom: savedList.nom,
            codexId: savedList.codexId,
            formations: savedList.formations || [],
            dateCreation: savedList.dateCreation || new Date().toISOString(),
        });
    }, []);

    // ========== CHARGER DEPUIS initialListId ==========
    useEffect(() => {
        if (!initialListId) return;
        loadAllListes(null).then(lists => {
            const found = lists.find(l => l.id === initialListId);
            if (found) chargerListe(found);
        });
    }, [initialListId, chargerListe]);

    // ========== SAUVEGARDER LA LISTE ==========
    const sauvegarderListe = async (user) => {
        const now = new Date().toISOString();
        const listeASauvegarder = {
            ...liste,
            totalPoints: calculerCoutTotal(),
            dateModification: now,
        };
        await saveListe(listeASauvegarder, user);
    };

    // ========== RÉORDONNER LES FORMATIONS ==========
    const reordonnerFormations = (activeId, overId) => {
        setListe(prev => {
            const oldIndex = prev.formations.findIndex(f => f.id === activeId);
            const newIndex = prev.formations.findIndex(f => f.id === overId);
            if (oldIndex === -1 || newIndex === -1) return prev;
            const formations = [...prev.formations];
            formations.splice(newIndex, 0, formations.splice(oldIndex, 1)[0]);
            return { ...prev, formations };
        });
    };

    // ========== RENOMMER LA LISTE ==========
    const renommerListe = (nom) => {
        setListe(prev => ({ ...prev, nom }));
    };

    return (
        <ArmyListContext.Provider value={{
            liste,
            validation,
            validator,
            ajouterFormation,
            dupliquerFormation,
            supprimerFormation,
            selectionnerItem,
            ajouterAmelioration,
            supprimerAmelioration,
            calculerCoutTotal,
            sauvegarderListe,
            renommerListe,
            reordonnerFormations,
            chargerListe
        }}>
            {children}
            <Snackbar
                open={notification.open}
                autoHideDuration={4000}
                onClose={() => setNotification(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    severity="error"
                    onClose={() => setNotification(prev => ({ ...prev, open: false }))}
                    sx={{ width: '100%' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
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