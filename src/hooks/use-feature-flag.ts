import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/supabase';

// useFeatureFlag - React hook for working with feature flags
export function useFeatureFlag(feature: string) {
    const [value, setValueState] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        api.feature.get(feature)
            .then(val => { if (mounted) setValueState(val); })
            .catch(() => { if (mounted) setValueState(false); })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [feature]);

    const setValue = useCallback(async (newValue: boolean) => {
        setLoading(true);
        await api.feature.set(feature, newValue);
        setValueState(newValue);
        setLoading(false);
    }, [feature]);

    return { value, loading, setValue };
} 