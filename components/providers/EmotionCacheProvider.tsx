'use client';

import React, { useState } from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';

export function NextAppDirEmotionCacheProvider({
    options,
    children,
}: {
    options: { key: string; prepend?: boolean };
    children: React.ReactNode;
}) {
    const [registry] = useState(() => {
        const cache = createCache(options);
        cache.compat = true;

        const prevInsert = cache.insert;
        let inserted: { name: string; isGlobal: boolean }[] = [];

        cache.insert = (...args) => {
            const [selector, serialized] = args;
            if (cache.inserted[serialized.name] === undefined) {
                inserted.push({
                    name: serialized.name,
                    isGlobal: !selector,
                });
            }
            return prevInsert(...args);
        };

        const flush = () => {
            const prevInserted = inserted;
            inserted = [];
            return prevInserted;
        };

        return { cache, flush };
    });

    useServerInsertedHTML(() => {
        const inserted = registry.flush();
        if (inserted.length === 0) return null;

        let styles = '';
        let dataEmotionAttribute = registry.cache.key;

        const globals: { name: string; style: string }[] = [];

        for (const { name, isGlobal } of inserted) {
            const style = registry.cache.inserted[name];
            if (typeof style === 'string') {
                if (isGlobal) {
                    globals.push({ name, style });
                } else {
                    styles += style;
                    dataEmotionAttribute += ` ${name}`;
                }
            }
        }

        return (
            <>
                {globals.map(({ name, style }) => (
                    <style
                        key={name}
                        data-emotion={`${registry.cache.key}-global ${name}`}
                        dangerouslySetInnerHTML={{ __html: style }}
                    />
                ))}
                {styles && (
                    <style
                        data-emotion={dataEmotionAttribute}
                        dangerouslySetInnerHTML={{ __html: styles }}
                    />
                )}
            </>
        );
    });

    return <CacheProvider value={registry.cache}>{children}</CacheProvider>;
}
