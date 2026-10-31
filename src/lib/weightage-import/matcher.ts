import { ParsedExamWeightage, ParsedSubjectWeightage, ParsedTopicWeightage } from './parser';

export interface DatabaseTopic {
  id: string;
  name: string;
  subjectId: string;
  subjectName: string;
}

export interface DatabaseExam {
  id: string;
  name: string;
  subjects: {
    id: string;
    name: string;
    topics: {
      id: string;
      name: string;
    }[];
  }[];
}

export interface MatchedTopicWeightage extends ParsedTopicWeightage {
  topicId?: string;
  isMatched: boolean;
}

export interface MatchedSubjectWeightage extends Omit<ParsedSubjectWeightage, 'topics'> {
  subjectId?: string;
  isMatched: boolean;
  topics: MatchedTopicWeightage[];
}

export interface MatchedExamWeightage extends Omit<ParsedExamWeightage, 'subjects'> {
  examId?: string;
  isMatched: boolean;
  subjects: MatchedSubjectWeightage[];
}

const normalize = (str: string) => {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // remove punctuation
    .replace(/\s+/g, ' ')
    .trim();
};

const EXAM_ALIASES: Record<string, string> = {
  "tnpsc group 2 executive post stream": "tnpsc group 2 2a",
  "tnpsc group 2a ministerial post stream": "tnpsc group 2 2a",
  "isro assistant upper division clerk udc": "isro assistant udc",
  "state bank of india junior associate clerk": "sbi junior associate clerk",
  "indian overseas bank local bank officer lbo": "indian overseas bank lbo",
  "ibps clerk customer service associate": "ibps clerk crp csaxvi"
};

const SUBJECT_ALIASES: Record<string, string> = {
  "general financial awareness": "general awareness",
  "reasoning ability computer aptitude": "reasoning computer aptitude",
  "quantitative aptitude revised": "quantitative aptitude",
  "quantitative aptitude": "quantitative aptitude",
  "general english": "english language",
  "general knowledge space science": "general knowledge",
  "general economy banking awareness": "general economy banking awareness",
  "generaleconomybanking awareness": "general economy banking awareness",
  "english knowledge": "english knowledge",
  "data analysis interpretation": "data analysis interpretation",
  "reasoning and computer aptitude": "reasoning computer aptitude",
  "general tamil or general english sslc": "tamil english language",
  "aptitude mental ability sslc": "aptitude mental ability",
  "indian economy tn admin unit v": "indian economy development administration in tn",
  "indian polity constitution unit iv": "indian polity",
  "general science history of india": "general science",
  "general intelligence reasoning sslc": "aptitude mental ability",
  "administration of states with reference to tn": "indian economy development administration in tn",
  "modern history of tn tamil society": "history culture sociopolitical movements in tn",
  "tn economy social issues": "indian economy development administration in tn",
  "science technology in development": "general science",
  "aptitude mental ability tests": "aptitude mental ability"
};

const TOPIC_ALIASES: Record<string, string> = {
  "general intelligence reasoning sslc": "reasoning",
  "administration of states with reference to tn": "state administration chain",
  "modern history of tn tamil society": "historyculture of tn",
  "tn economy social issues": "tn economy social issues",
  "science technology in development": "st"
};

export function matchExamsSubjectsAndTopics(
  parsedExams: ParsedExamWeightage[],
  dbExams: DatabaseExam[]
): MatchedExamWeightage[] {

  return parsedExams.map(pe => {
    let peNorm = normalize(pe.examName);
    
    // Check aliases
    if (EXAM_ALIASES[peNorm]) {
      peNorm = EXAM_ALIASES[peNorm];
    }

    // 1. Match Exam
    const examMatch = dbExams.find(dbE => {
      let dbENorm = normalize(dbE.name);
      if (EXAM_ALIASES[dbENorm]) dbENorm = EXAM_ALIASES[dbENorm];
      return dbENorm === peNorm;
    });

    if (!examMatch) {
      return {
        ...pe,
        examId: undefined,
        isMatched: false,
        subjects: pe.subjects.map(ps => ({
          ...ps,
          subjectId: undefined,
          isMatched: false,
          topics: ps.topics.map(pt => ({
            ...pt,
            topicId: undefined,
            isMatched: false
          }))
        }))
      };
    }

    // 2. Match Subjects
    let matchedSubjects = pe.subjects.map(ps => {
      let psNorm = normalize(ps.subjectName);
      if (SUBJECT_ALIASES[psNorm]) psNorm = SUBJECT_ALIASES[psNorm];

      const subjectMatch = examMatch.subjects.find(dbS => {
         let dbSNorm = normalize(dbS.name);
         if (SUBJECT_ALIASES[dbSNorm]) dbSNorm = SUBJECT_ALIASES[dbSNorm];
         return dbSNorm === psNorm;
      });

      if (!subjectMatch) {
        return {
          ...ps,
          subjectId: undefined,
          isMatched: false,
          topics: ps.topics.map(pt => ({
            ...pt,
            topicId: undefined,
            isMatched: false
          }))
        };
      }

      // 3. Match Topics
      const matchedTopics = ps.topics.map(pt => {
        let ptNorm = normalize(pt.topicName);
        if (TOPIC_ALIASES[ptNorm]) ptNorm = TOPIC_ALIASES[ptNorm];
        
        const topicMatch = subjectMatch.topics.find(dbT => {
          let dbTNorm = normalize(dbT.name);
          if (TOPIC_ALIASES[dbTNorm]) dbTNorm = TOPIC_ALIASES[dbTNorm];
          return dbTNorm === ptNorm;
        });

        return {
          ...pt,
          topicId: topicMatch?.id,
          isMatched: !!topicMatch
        };
      });

      return {
        ...ps,
        subjectId: subjectMatch.id,
        isMatched: true,
        topics: matchedTopics
      };
    });

    if (peNorm === "tnpsc group 2 2a" && pe.examName.toLowerCase().includes("group 2a")) {
      const group2ASubject = examMatch.subjects.find(s => s.name === "Group 2A Mains Paper II (Objective)");
      if (group2ASubject) {
        const mappedTopics = pe.subjects.map(ps => {
           let psNorm = normalize(ps.subjectName);
           if (TOPIC_ALIASES[psNorm]) psNorm = TOPIC_ALIASES[psNorm];
           
           const topicMatch = group2ASubject.topics.find(t => {
             let tNorm = normalize(t.name);
             if (TOPIC_ALIASES[tNorm]) tNorm = TOPIC_ALIASES[tNorm];
             return tNorm === psNorm;
           });
           
           return {
             topicName: ps.subjectName,
             weightage: ps.weightage,
             questionCount: ps.questionCount,
             marksCount: ps.marksCount,
             estimatedDifficulty: ps.estimatedDifficulty,
             priorityRank: ps.priorityRank,
             topicId: topicMatch?.id,
             isMatched: !!topicMatch
           };
        });
        
        matchedSubjects = [{
           subjectName: "Group 2A Mains Paper II (Objective)",
           subjectId: group2ASubject.id,
           isMatched: true,
           topics: mappedTopics,
           weightage: undefined,
           questionCount: undefined,
           marksCount: undefined,
           priorityRank: undefined,
           estimatedDifficulty: undefined,
           studyRecommendation: undefined
        }];
      }
    }

    return {
      ...pe,
      examId: examMatch.id,
      isMatched: true,
      subjects: matchedSubjects
    };
  });
}
