import { useState, useEffect } from "react";
import { auth, db } from "../utils/firebase";
import { ref, onValue } from "firebase/database";

const useUserVaults = () => {
    const [customVaults, setCustomVaults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uid, setUid] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                setUid(user.uid);
                // Only check customwatchlists
                const vaultsRef = ref(db, `users/${user.uid}/customwatchlists`);

                const unsubscribeVaults = onValue(vaultsRef, (snapshot) => {
                    const vaultsData = snapshot.exists() ? snapshot.val() : null;
                    const combined = {};

                    if (vaultsData) {
                        Object.keys(vaultsData).forEach(key => {
                            combined[key] = { id: key, ...vaultsData[key] };
                        });
                    }

                    setCustomVaults(Object.values(combined));
                    setLoading(false);
                }, (error) => {
                    console.error('Error fetching custom vaults:', error);
                    setLoading(false);
                });

                return () => {
                    unsubscribeVaults();
                };
            } else {
                setUid(null);
                setCustomVaults([]);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    return { customVaults, loading, uid };
};

export default useUserVaults;
