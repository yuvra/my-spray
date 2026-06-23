import type { ComponentType } from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

/** Pomegranate app logo — full artwork inside viewBox (crown + body + seeds) */
export function PomegranateLogo({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 88" fill="none">
      <G>
        <Path d="M28 22 L32 10 L36 22 Z" fill="#3D6B35" />
        <Path d="M36 20 L40 8 L44 20 Z" fill="#4A7C42" />
        <Path d="M44 22 L48 10 L52 22 Z" fill="#3D6B35" />
        <Ellipse cx="40" cy="50" rx="26" ry="30" fill="#7A1528" />
        <Ellipse cx="40" cy="52" rx="24" ry="28" fill="#9B1B30" />
        <Ellipse cx="40" cy="54" rx="20" ry="24" fill="#B5223A" />
        <Ellipse cx="30" cy="44" rx="7" ry="9" fill="#FFFFFF" opacity={0.12} />
        <Circle cx="32" cy="50" r="3.2" fill="#E9C46A" />
        <Circle cx="40" cy="46" r="3.2" fill="#F4D35E" />
        <Circle cx="48" cy="50" r="3.2" fill="#E9C46A" />
        <Circle cx="36" cy="58" r="3" fill="#E9C46A" />
        <Circle cx="44" cy="58" r="3" fill="#F4D35E" />
        <Circle cx="40" cy="64" r="2.8" fill="#E9C46A" />
      </G>
    </Svg>
  );
}

export function HomeIcon({ size = 24, color = '#9B1B30', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ScheduleIcon({ size = 24, color = '#9B1B30', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="16" rx="2" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M8 3v4M16 3v4M3 10h18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M8 14h2M14 14h2M8 17h6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function ExpensesIcon({ size = 24, color = '#9B1B30', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 19V5M4 19h16M8 15v-4M12 15V9M16 15v-2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M4 19V5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function CommunityIcon({ size = 24, color = '#9B1B30', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="8" r="3" stroke={color} strokeWidth={strokeWidth} />
      <Circle cx="17" cy="9" r="2.5" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M4 19c0-3 2.2-5 5-5s5 2 5 5M14 19c0-2.2 1.6-4 3.5-4.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function SettingsIcon({ size = 24, color = '#9B1B30', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function SmsIcon({ size = 24, color = '#FFFFFF', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 0 1 8-8h4a8 8 0 0 1 8 8Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Path d="M9 12h6M9 9h4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function PhoneCallIcon({ size = 24, color = '#FFFFFF', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.5 4.5c1.2 2.4 2.6 4.6 4.3 6.3 1.7 1.7 3.9 3.1 6.3 4.3l2.2-2.2c.4-.4 1-.5 1.5-.3 1.1.4 2.3.7 3.5.7.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.4 21 3 13.6 3 4c0-.6.4-1 1-1h3.2c.6 0 1 .4 1 1 0 1.2.3 2.4.7 3.5.2.5.1 1.1-.4 1.5l-2 2Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function InfoIcon({ size = 20, color = '#9B1B30', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M12 11v5M12 8h.01" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function CalendarIcon({ size = 22, color = '#3D6B35', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="16" rx="2" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M8 3v4M16 3v4M3 10h18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Circle cx="8" cy="14" r="1" fill={color} />
      <Circle cx="12" cy="14" r="1" fill={color} />
      <Circle cx="16" cy="14" r="1" fill={color} />
      <Circle cx="8" cy="17" r="1" fill={color} />
      <Circle cx="12" cy="17" r="1" fill={color} />
    </Svg>
  );
}

export function SprayActivityIcon({ size = 36, color = '#3D6B35' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <Path d="M20 6v6M16 10h8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path
        d="M12 28c0-4 3.5-8 8-8s8 4 8 8v4H12v-4Z"
        fill="#C8E6C9"
        stroke={color}
        strokeWidth={1.5}
      />
      <Path d="M20 14c-2 0-3.5 1.5-3.5 3.5S18 21 20 21s3.5-1.5 3.5-3.5S22 14 20 14Z" fill={color} />
      <Path d="M10 32h20" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export function FertActivityIcon({ size = 36, color = '#3D6B35' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <Path
        d="M12 14h16l-2 18H14L12 14Z"
        fill="#E8F5E9"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path d="M14 14V10a6 6 0 0 1 12 0v4" stroke={color} strokeWidth={1.5} />
      <Path d="M16 22h8M17 26h6" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
    </Svg>
  );
}

export function WaterActivityIcon({ size = 36, color = '#3D6B35' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <Path
        d="M20 8c-6 8-10 12-10 17a10 10 0 0 0 20 0c0-5-4-9-10-17Z"
        fill="#E3F2FD"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path d="M16 28h8M14 32h12" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
    </Svg>
  );
}

/** Small detail-row icons for activity card sections */
export function FungicideDetailIcon({ size = 20, color = '#2E7D32' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Ellipse cx="12" cy="9" rx="7" ry="5" fill="#E8F5E9" stroke={color} strokeWidth={1.5} />
      <Path d="M12 14v6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx="9" cy="8" r="1" fill={color} />
      <Circle cx="13" cy="7" r="0.8" fill={color} />
      <Circle cx="15" cy="9.5" r="0.7" fill={color} />
      <Path
        d="M8 18h8"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function InsecticideDetailIcon({ size = 20, color = '#D97706' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Ellipse cx="12" cy="13" rx="5" ry="6" fill="#FEF3C7" stroke={color} strokeWidth={1.5} />
      <Circle cx="12" cy="7" r="2.5" fill="#FEF3C7" stroke={color} strokeWidth={1.5} />
      <Path d="M8 11 5 8M16 11l3-3M8 15 5 18M16 15l3 3" stroke={color} strokeWidth={1.3} strokeLinecap="round" />
    </Svg>
  );
}

export function PgrDetailIcon({ size = 20, color = '#7C3AED' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 20V10" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M8 14c0-3 1.8-5 4-5s4 2 4 5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M12 10c-2 0-3.5-1.5-3.5-3.5S10 3 12 3s3.5 1.5 3.5 3.5S14 10 12 10Z" fill="#EDE9FE" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

export function FertilizerSprayDetailIcon({ size = 20, color = '#059669' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 8h10l-1.5 12H8.5L7 8Z" fill="#D1FAE5" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M9 8V6a3 3 0 0 1 6 0v2" stroke={color} strokeWidth={1.5} />
      <Path d="M10 13h4" stroke={color} strokeWidth={1.3} strokeLinecap="round" />
    </Svg>
  );
}

export function MicronutrientDetailIcon({ size = 20, color = '#2563EB' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8" fill="#DBEAFE" stroke={color} strokeWidth={1.5} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Path d="M12 4v3M12 17v3M4 12h3M17 12h3" stroke={color} strokeWidth={1.3} strokeLinecap="round" />
    </Svg>
  );
}

export function NotesDetailIcon({ size = 20, color = '#6B7280' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 4h7l4 4v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" fill="#F3F4F6" stroke={color} strokeWidth={1.5} />
      <Path d="M14 4v4h4" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </Svg>
  );
}

export function BactericideDetailIcon({ size = 20, color = '#0D9488' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8" fill="#CCFBF1" stroke={color} strokeWidth={1.5} />
      <Path d="M8 8l8 8M16 8l-8 8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx="9" cy="10" r="1.2" fill={color} />
      <Circle cx="15" cy="14" r="1" fill={color} />
    </Svg>
  );
}

export function PhBalancerDetailIcon({ size = 20, color = '#0891B2' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3c-4 5-7 8-7 12a7 7 0 0 0 14 0c0-4-3-7-7-12Z"
        fill="#E0F2FE"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path d="M10 13h4M12 11v4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export function SpreaderStickerDetailIcon({ size = 20, color = '#DB2777' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" fill="#FCE7F3" stroke={color} strokeWidth={1.5} />
      <Path
        d="M12 5v2M12 17v2M5 12h2M17 12h2M7.05 7.05l1.4 1.4M15.55 15.55l1.4 1.4M16.95 7.05l-1.4 1.4M8.45 15.55l-1.4 1.4"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function CheckCircleIcon({ size = 22, color = '#3D6B35' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Path d="M8 12.5 11 15.5 16 9.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MoreVerticalIcon({ size = 20, color = '#6B4A4F', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="6" r="1.5" fill={color} />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
      <Circle cx="12" cy="18" r="1.5" fill={color} />
    </Svg>
  );
}

export function CheckIcon({ size = 18, color = '#FFFFFF', strokeWidth = 2.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12.5 10 17.5 19 7.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CloseIcon({ size = 18, color = '#3D6B35', strokeWidth = 2.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 7l10 10M17 7 7 17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export type TabIconName = 'home' | 'schedule' | 'expenses' | 'community' | 'settings';

const TAB_ICONS: Record<TabIconName, ComponentType<IconProps>> = {
  home: HomeIcon,
  schedule: ScheduleIcon,
  expenses: ExpensesIcon,
  community: CommunityIcon,
  settings: SettingsIcon,
};

export function TabBarIcon({
  name,
  color,
  size = 24,
  focused,
}: {
  name: TabIconName;
  color: string;
  size?: number;
  focused?: boolean;
}) {
  const Icon = TAB_ICONS[name];
  return <Icon color={color} size={size} strokeWidth={focused ? 2.25 : 1.85} />;
}
