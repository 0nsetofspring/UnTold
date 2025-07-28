import axiosInstance from '@/api/axiosInstance';

const fetchSentiment = async (text: string) => {
  try {
    const response = await axiosInstance.post('/api/ml/sentiment', { text });
    console.log('감정 분석 결과:', response.data);
    // 예: { label: 'positive', score: 0.99... }
    return response.data;
  } catch (error) {
    console.error('감정 분석 API 호출 실패:', error);
    return null;
  }
};

export default fetchSentiment;