import Svg, { Path } from 'react-native-svg';

type IconProps = {
  size?: number;
  color?: string;
};

export function RainIcon({ size = 18, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 14c-2.5 0-4.5-2-4.5-4.5S4.5 5 7 5c.6 0 1.2.1 1.7.4C9.8 2.6 12.2 1 15 1c3.3 0 6 2.7 6 6 0 .3 0 .7-.1 1 2.2.5 3.6 2.5 3.6 4.9 0 2.8-2.2 5-5 5H7Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path d="M9 17v3M12 16v4M15 17v3" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function HumidityIcon({ size = 18, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3c-4 6-7 9.5-7 13a7 7 0 0 0 14 0c0-3.5-3-7-7-13Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function WindIcon({ size = 18, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8h11a3 3 0 1 0-3-3M4 16h13a3 3 0 1 1-3 3M4 12h15"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Full image URL for weather icon */
export function weatherIconUrl(icon: string): string {
  if (icon.startsWith('http')) return icon;
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

type Gradient = readonly [string, string];

/** Sky gradient keyed by Google Weather condition type */
export function getWeatherGradient(conditionType: string, isDaytime = true): Gradient {
  const type = conditionType.toUpperCase();

  if (!isDaytime) {
    if (type.includes('CLEAR') || type.includes('SUNNY')) return ['#1A2744', '#2D3F6B'];
    if (type.includes('CLOUD') || type.includes('OVERCAST')) return ['#2A3340', '#4A5568'];
    if (type.includes('RAIN') || type.includes('DRIZZLE') || type.includes('SHOWER')) {
      return ['#1F2D3D', '#3D4F63'];
    }
    if (type.includes('THUNDER') || type.includes('STORM')) return ['#1A2233', '#2E3A52'];
    if (type.includes('FOG') || type.includes('MIST') || type.includes('HAZE')) {
      return ['#1E2838', '#354152'];
    }
    return ['#1E2838', '#354152'];
  }

  if (type.includes('CLEAR') || type.includes('SUNNY')) return ['#3B82C4', '#7EC8E3'];
  if (type.includes('PARTLY') || type.includes('MOSTLY_CLEAR')) return ['#4A8FC7', '#8BBDE0'];
  if (type.includes('CLOUD') || type.includes('OVERCAST')) return ['#6B7F94', '#9AADBE'];
  if (type.includes('RAIN') || type.includes('DRIZZLE') || type.includes('SHOWER')) {
    return ['#4A6278', '#6E8A9E'];
  }
  if (type.includes('THUNDER') || type.includes('STORM')) return ['#3D5068', '#5C7088'];
  if (type.includes('SNOW') || type.includes('SLEET') || type.includes('ICE')) {
    return ['#8BAFC4', '#B8D4E8'];
  }
  if (type.includes('FOG') || type.includes('MIST') || type.includes('HAZE') || type.includes('DUST')) {
    return ['#7A8F9E', '#A8BAC6'];
  }
  return ['#4A8FC7', '#8BBDE0'];
}

/** Capitalize weather description like Google Weather */
export function formatWeatherDescription(description: string): string {
  if (!description) return '';
  return description.charAt(0).toUpperCase() + description.slice(1);
}
