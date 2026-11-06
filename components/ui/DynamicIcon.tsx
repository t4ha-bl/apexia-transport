'use client';
import dynamic from 'next/dynamic';
import { ComponentType } from 'react';
import { Star } from '@phosphor-icons/react';

type IconProps = { size?: number; className?: string; weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone' };

// Loads a single Phosphor icon by name (the name chosen in the admin), instead of
// bundling the whole ~1,500-icon library into the public site. Each icon is its own
// tiny file, downloaded only when it is actually displayed.
const cache = new Map<string, ComponentType<IconProps>>();

function load(name: string): ComponentType<IconProps> {
  let C = cache.get(name);
  if (!C) {
    C = dynamic<IconProps>(
      () => import(
        /* webpackInclude: /\.es\.js$/ */
        /* webpackChunkName: "icon-[request]" */
        `phosphor-icons-csr/${name}.es.js`
      ).then((m: any) => m[name] || Star).catch(() => Star),
      { ssr: false, loading: () => null }
    );
    cache.set(name, C);
  }
  return C;
}

export default function DynamicIcon({ name, size = 24, ...props }: IconProps & { name?: string }) {
  // Only plain icon names are allowed (also guards against odd values saved in the admin)
  if (!name || !/^[A-Z][A-Za-z0-9]{1,40}$/.test(name)) return <Star size={size} {...props} />;
  const Icon = load(name);
  // Reserve the space while the icon file loads, so nothing shifts
  return (
    <span className={props.className} style={{ display: 'inline-flex', width: size, height: size }}>
      <Icon size={size} weight={props.weight} />
    </span>
  );
}
