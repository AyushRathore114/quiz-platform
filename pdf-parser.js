/**
 * PDF Parser Module
 * Extracts questions from uploaded PDF files and converts them into quiz format.
 */

class PDFQuestionParser {
    constructor() {
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
    }

    async parsePDF(file, onProgress = () => {}) {
        try {
            onProgress(10, 'Reading PDF file...');
            const arrayBuffer = await file.arrayBuffer();
            
            onProgress(20, 'Loading PDF document...');
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            const totalPages = pdf.numPages;
            let fullText = '';
            
            for (let i = 1; i <= totalPages; i++) {
                const progress = 20 + (i / totalPages) * 40;
                onProgress(progress, `Extracting text from page ${i}/${totalPages}...`);
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n\n';
            }

            onProgress(65, 'Detecting questions...');
            const questions = this.extractQuestions(fullText);
            
            onProgress(80, 'Categorizing questions...');
            const categorizedQuestions = this.categorizeQuestions(questions);
            
            onProgress(95, 'Generating solutions...');
            const finalQuestions = this.generateSolutions(categorizedQuestions);
            
            onProgress(100, `Found ${finalQuestions.length} questions!`);
            return finalQuestions;
        } catch (error) {
            console.error('PDF parsing error:', error);
            throw new Error('Failed to parse PDF. Please ensure it contains readable text.');
        }
    }

    extractQuestions(text) {
        const questions = [];
        text = text.replace(/\s+/g, ' ').trim();
        
        const patterns = [
            /(?:Q(?:uestion)?[\s.]*(\d+)[.):\s]+)(.*?)(?=Q(?:uestion)?[\s.]*\d+[.):\s]|$)/gi,
            /(?:^|\n)\s*(\d+)[.)]\s+(.*?)(?=(?:^|\n)\s*\d+[.)]\s|$)/gs,
            /([^.!?\n]*\?)\s*((?:[A-D][.)]\s*[^\n]+\n?){2,4})/gi,
        ];

        let matched = false;
        for (const pattern of patterns) {
            const matches = [...text.matchAll(pattern)];
            if (matches.length >= 2) {
                for (const match of matches) {
                    const questionBlock = match[2] || match[0];
                    const parsed = this.parseQuestionBlock(questionBlock);
                    if (parsed) { questions.push(parsed); matched = true; }
                }
                if (matched) break;
            }
        }

        if (!matched) {
            const fallbackQuestions = this.fallbackExtraction(text);
            questions.push(...fallbackQuestions);
        }
        return questions;
    }

    parseQuestionBlock(block) {
        if (!block || block.trim().length < 10) return null;
        const optionPatterns = [/([A-D])[.)]\s*([^\n]+)/gi, /\(([A-D])\)\s*([^\n]+)/gi, /([a-d])[.)]\s*([^\n]+)/gi];
        let questionText = block;
        let options = [];
        let correctAnswer = -1;

        for (const optPattern of optionPatterns) {
            const optMatches = [...block.matchAll(optPattern)];
            if (optMatches.length >= 2) {
                const firstOptIndex = block.indexOf(optMatches[0][0]);
                questionText = block.substring(0, firstOptIndex).trim();
                options = optMatches.map(m => m[2].trim());
                break;
            }
        }

        const answerPatterns = [/(?:answer|ans|correct)[:\s]*([A-D])/i, /([A-D])\s*(?:\*|correct|right)/i, /\*\s*([A-D])/i];
        for (const ansPattern of answerPatterns) {
            const ansMatch = block.match(ansPattern);
            if (ansMatch) { correctAnswer = ansMatch[1].toUpperCase().charCodeAt(0) - 65; questionText = questionText.replace(ansPattern, '').trim(); break; }
        }

        questionText = questionText.replace(/^\d+[.)]\s*/, '').trim();
        questionText = questionText.replace(/^Q(?:uestion)?[\s.]*\d*[.):\s]*/i, '').trim();
        if (!questionText || questionText.length < 5) return null;
        if (options.length < 2) return null;
        if (correctAnswer === -1) correctAnswer = 0;

        return { question: questionText, options: options.slice(0, 4), correctAnswer: correctAnswer, explanation: '' };
    }

    fallbackExtraction(text) {
        const questions = [];
        const sentences = text.split(/(?<=[.!?])\s+/);
        let currentQuestion = '';
        let collectingOptions = false;
        let options = [];

        for (const sentence of sentences) {
            if (sentence.includes('?')) {
                if (currentQuestion && options.length >= 2) {
                    questions.push({ question: currentQuestion, options: options.slice(0, 4), correctAnswer: 0, explanation: '' });
                }
                currentQuestion = sentence.trim();
                options = [];
                collectingOptions = true;
            } else if (collectingOptions) {
                const optMatch = sentence.match(/^[A-Da-d][.)]\s*(.*)/);
                if (optMatch) { options.push(optMatch[1].trim()); }
                else if (options.length >= 2) { collectingOptions = false; }
            }
        }
        if (currentQuestion && options.length >= 2) {
            questions.push({ question: currentQuestion, options: options.slice(0, 4), correctAnswer: 0, explanation: '' });
        }
        return questions;
    }

    categorizeQuestions(questions) {
        const categoryKeywords = {
            'Programming': ['code', 'function', 'variable', 'loop', 'array', 'class', 'object', 'method', 'syntax', 'compile', 'debug', 'algorithm', 'data structure', 'programming', 'software'],
            'Mathematics': ['calculate', 'equation', 'formula', 'number', 'algebra', 'geometry', 'trigonometry', 'calculus', 'probability', 'statistics', 'math', 'sum', 'product', 'integral'],
            'Science': ['atom', 'molecule', 'cell', 'energy', 'force', 'gravity', 'chemical', 'biology', 'physics', 'chemistry', 'experiment', 'hypothesis', 'electron', 'nucleus'],
            'History': ['war', 'century', 'kingdom', 'empire', 'revolution', 'independence', 'ancient', 'medieval', 'civilization', 'dynasty', 'treaty', 'colonial'],
            'Geography': ['country', 'capital', 'continent', 'ocean', 'river', 'mountain', 'climate', 'population', 'region', 'border', 'island', 'desert'],
            'Technology': ['computer', 'internet', 'network', 'database', 'server', 'cloud', 'AI', 'machine learning', 'cybersecurity', 'protocol', 'hardware', 'software'],
            'English': ['grammar', 'verb', 'noun', 'adjective', 'synonym', 'antonym', 'sentence', 'paragraph', 'literature', 'poetry', 'vocabulary', 'tense'],
            'Business': ['market', 'finance', 'economy', 'management', 'strategy', 'investment', 'profit', 'revenue', 'startup', 'entrepreneurship', 'accounting'],
            'General Knowledge': []
        };

        return questions.map(q => {
            const qText = (q.question + ' ' + q.options.join(' ')).toLowerCase();
            let bestCategory = 'General Knowledge';
            let bestScore = 0;
            for (const [category, keywords] of Object.entries(categoryKeywords)) {
                if (keywords.length === 0) continue;
                const score = keywords.filter(kw => qText.includes(kw)).length;
                if (score > bestScore) { bestScore = score; bestCategory = category; }
            }
            return { ...q, category: bestCategory };
        });
    }

    generateSolutions(questions) {
        return questions.map(q => {
            if (!q.explanation || q.explanation.trim() === '') {
                const correctOption = q.options[q.correctAnswer] || q.options[0];
                q.explanation = `The correct answer is "${correctOption}". This is based on the information provided in your study material. Review the relevant section in your PDF for a detailed explanation.`;
            }
            return q;
        });
    }
}

window.PDFQuestionParser = PDFQuestionParser;
