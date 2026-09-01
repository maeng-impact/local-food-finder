import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function getApiKey(keyName) {
  const rawKey = process.env[keyName] || process.env[`NEXT_PUBLIC_${keyName}`] || '';
  if (!rawKey) return '';
  return decodeURIComponent(rawKey);
}

export async function GET() {
  const results = {
    tourApi: 0,
    petTour: 0,
    errors: [],
    rawResponseSample: null
  };

  try {
    const tourKey = getApiKey('TOUR_API_KEY');
    
    if (!tourKey) {
      results.errors.push('TOUR_API_KEY 환경 변수가 Vercel에 설정되어 있지 않습니다.');
    } else {
      // Decode된 키를 사용
      const url = `https://apis.data.go.kr/B551011/KorService1/areaBasedList1?serviceKey=${encodeURIComponent(tourKey)}&numOfRows=20&pageNo=1&MobileOS=ETC&MobileApp=LocalApp&_type=json&areaCode=31`;
      
      const res = await fetch(url);
      const textData = await res.text();

      try {
        const data = JSON.parse(textData);
        results.rawResponseSample = data; // 응답 데이터 확인용

        const items = data.response?.body?.items?.item || [];

        const placesToInsert = items.map(item => ({
          title: item.title || '장소명 없음',
          category: item.contenttypeid === '39' ? '음식점' : '관광지',
          address: item.addr1 ? item.addr1 + (item.addr2 ? ' ' + item.addr2 : '') : '주소 정보 없음',
          tel: item.tel || '',
          image_url: item.firstimage || item.firstimage2 || '',
          latitude: item.mapy ? parseFloat(item.mapy) : null,
          longitude: item.mapx ? parseFloat(item.mapx) : null,
          source_type: 'tour_api'
        })).filter(p => p.title && p.address !== '주소 정보 없음');

        if (placesToInsert.length > 0) {
          const { error } = await supabase
            .from('places')
            .upsert(placesToInsert, { onConflict: 'title,address' });

          if (error) {
            results.errors.push(`Supabase Insert 에러: ${error.message}`);
          } else {
            results.tourApi = placesToInsert.length;
          }
        } else {
          results.errors.push('API 응답은 성공했으나 항목(item)이 비어있습니다.');
        }
      } catch (jsonErr) {
        // API 키가 승인되지 않았거나 오류일 때 XML/HTML 에러문이 반환됨
        results.errors.push(`API 응답이 JSON 형식이 아닙니다 (인증 실패 가능성 높음). 응답 원문: ${textData.slice(0, 300)}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: '공공데이터 수집 진단 완료',
      summary: results
    });

  } catch (globalError) {
    return NextResponse.json({
      success: false,
      error: globalError.message
    }, { status: 500 });
  }
}