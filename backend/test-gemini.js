const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI('AIzaSyCe3gWWQy-wd6jvZkEhKYtfHPZ3DahDmJE');
async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Hi');
    console.log('success', result.response.text());
  } catch (e) {
    console.error('ERROR MSG:', e.message);
  }
}
run();
