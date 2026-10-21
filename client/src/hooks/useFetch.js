import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../services/api';

// Loads GET `url` (with params) and exposes loading / error / reload.
export default function useFetch(url, params, { skip = false } = {}) {
  const key = JSON.stringify(params || {});
  const [state, setState] = useState({ data: null, meta: null, loading: !skip, error: '' });
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (skip) return undefined;
    let live = true;
    setState((s) => ({ ...s, loading: true, error: '' }));
    api.get(url, { params: JSON.parse(key) })
      .then((r) => live && setState({ data: r.data.data, meta: r.data.meta || null, loading: false, error: '' }))
      .catch((e) => live && setState({ data: null, meta: null, loading: false, error: errMsg(e) }));
    return () => { live = false; };
  }, [url, key, tick, skip]);

  return { ...state, reload };
}
