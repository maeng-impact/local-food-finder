import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET() {
  const results = {
    tourApi: 0,
    errors: [],
    details: []
  };

  try {
    const rawKey = process.env.TOUR_API_KEY || process.env.NEXT_PUBLIC_TOUR_API_KEY || '';
    
    if (!rawKey) {
      results.errors.push('TOUR_API_KEY 가 설정되지 않았습니다.');
      return NextResponse.json({ success: false, summary: results });
    }

    // 인코딩 키 / 디코딩 키 두 형태 모두 시도
    const decodedKey = decodeURIComponent(rawKey);
    const encodedKey = encodeURIComponent(decodedKey);

    // 시도할 키 형태 배열
    const keysToTry = [decodedKey, rawKey, encodedKey];
    let fetchedItems = [];
    let lastErrorMsg = '';

    for (const key of keysToTry) {
      try {
        const url = `https://apis.data.go.kr/B551011/KorService1/areaBasedList1?serviceKey=${key}&numOfRows=20&pageNo=1&MobileOS=ETC&MobileApp=LocalApp&_type=json&areaCode=31`;
        const res = await fetch(url);
        const textData = await res.text();

        if (textData.startsWith('{')) {
          const data = JSON.parse(textData);
          const items = data.response?.body?.items?.item || [];
          if (items.length > 0) {
            fetchedItems = items;
            break; // 성공 시 반복문 종료
          }
        } else {
          lastErrorMsg = textData.slice(0, 150);
        }
      } catch (e) {
        lastErrorMsg = e.message;
      }
    }

    if (fetchedItems.length === 0) {
      results.errors.push(`API 호출 실패. 최신 응답 원문: ${lastErrorMsg}`);
      return NextResponse.json({ success: false, summary: results });
    }

    // DB 변환 및 저장
    const placesToInsert = fetchedItems.map(item => ({
      title: item.title || '알 수 없는 장소',
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
        results.errors.push(`Supabase 저장 오류: ${error.message}`);
      } else {
        results.tourApi = placesToInsert.length;
      }
    }

    return NextResponse.json({
      success: results.tourApi > 0,
      message: results.tourApi > 0 ? '공공데이터 수집 및 DB 저장 완료!' : '수집 실패',
      summary: results
    });

  } catch (globalError) {
    return NextResponse.json({
      success: false,
      error: globalError.message
    }, { status: 500 });
  }
}