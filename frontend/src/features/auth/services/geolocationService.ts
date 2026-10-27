export interface RealLocationData {
  locationName: string;
  ipAddress: string;
}

/**
 * Trích xuất vị trí địa lý thực tế (kết hợp GPS độ chính xác cao và IP Geolocation)
 */
export const getRealLocation = async (): Promise<RealLocationData> => {
  // 1. Thử lấy vị trí chính xác qua phần cứng GPS / WiFi thiết bị (HTML5 Geolocation)
  try {
    const coords = await new Promise<GeolocationCoordinates | null>((resolve) => {
      if (!('geolocation' in navigator)) {
        return resolve(null);
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos.coords),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 3500, maximumAge: 60000 }
      );
    });

    if (coords) {
      const { latitude, longitude } = coords;
      // Dịch tọa độ GPS ra tên phường/quận/thành phố bằng tiếng Việt
      const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=vi`;
      const res = await fetch(geoUrl, { signal: AbortSignal.timeout(3000) });
      
      let publicIp = '127.0.0.1';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(2000) });
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          publicIp = ipData.ip || publicIp;
        }
      } catch {}

      if (res.ok) {
        const data = await res.json();
        const ward = data.locality || '';
        const district = data.localityInfo?.administrative?.find((a: any) => a.adminLevel === 6)?.name || '';
        const city = data.city || data.principalSubdivision || 'TP. Hồ Chí Minh';
        
        const parts = [ward, district, city].filter(Boolean);
        const locationText = parts.length > 0 ? parts.join(', ') : 'Việt Nam';

        return {
          locationName: `${locationText} (GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          ipAddress: publicIp,
        };
      }
    }
  } catch (err) {
    console.warn('[GEOLOCATION] GPS lookup bypassed, switching to IP', err);
  }

  // 2. Dự phòng: Định vị theo địa chỉ IP công cộng thực tế (IP-API/ipwho.is)
  try {
    const ipRes = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(3000) });
    if (ipRes.ok) {
      const data = await ipRes.json();
      if (data.success) {
        let city = data.city || 'TP. Hồ Chí Minh';
        if (/ho chi minh|saigon|sai gon/i.test(city)) city = 'TP. Hồ Chí Minh';
        else if (/ha noi|hanoi/i.test(city)) city = 'Hà Nội';
        else if (/da nang/i.test(city)) city = 'Đà Nẵng';
        
        let isp = data.connection?.isp || '';
        if (/viettel/i.test(isp)) isp = 'Viettel';
        else if (/vnpt/i.test(isp)) isp = 'VNPT';
        else if (/fpt/i.test(isp)) isp = 'FPT';

        const ispSuffix = isp ? ` (${isp})` : '';

        // Dịch ngược tọa độ sang Phường / Xã chi tiết
        let ward = '';
        try {
          if (data.latitude && data.longitude) {
            const revRes = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${data.latitude}&longitude=${data.longitude}&localityLanguage=vi`,
              { signal: AbortSignal.timeout(2500) }
            );
            if (revRes.ok) {
              const rev = await revRes.json();
              if (rev.locality) ward = `Phường ${rev.locality}, `;
            }
          }
        } catch {}

        const coords = data.latitude && data.longitude 
          ? ` [${data.latitude.toFixed(4)}°B, ${data.longitude.toFixed(4)}°Đ]` 
          : '';

        return {
          locationName: `${ward}${city}, VN${coords}${ispSuffix}`,
          ipAddress: data.ip || '127.0.0.1',
        };
      }
    }
  } catch (err) {
    console.warn('[GEOLOCATION] IP lookup bypassed', err);
  }

  // 3. Fallback an toàn nếu hoàn toàn mất mạng ngoài
  return {
    locationName: 'TP. Hồ Chí Minh, Việt Nam (Mạng Nội Bộ)',
    ipAddress: '127.0.0.1',
  };
};
