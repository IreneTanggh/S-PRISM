import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { styled } from '@mui/material/styles';
import { spacePrompt } from './api/spacePrompt.tsx';
import { keywordsToST } from './space/keywordToSpace.js';
import { Tldraw, useEditor, Editor } from 'tldraw';
import { current } from '../LexicalEditor/time.js';
import {
  useDispatch,
  useSelector
} from 'react-redux';
import {
  GPT4Message,
  fetchFromOpenAi,
} from './api/fetchFromOpenAi.tsx'
import { setSelectedCite, setSelectedEntity, setSelectedContainerClass } from '../LexicalEditor/slices/SpaceSlice';

interface Message {
  text: string;
  type: 'user' | 'assistant';
}

interface StyledPaperProps {
  messageType?: 'user' | 'assistant';
}

interface OpenAIResponse {
  error?: { message: string };
  choices?: Array<{ message: { content: string } }>;
}

interface ChatInterfaceProps {
  editorRef: { current: Editor | null };
  currentDataset: string;
}

interface ChatBotProps {
  editorRef: { current: Editor | null };
  currentDataset: string;
}

const MessageBox = styled(Paper)<StyledPaperProps>(({ theme, messageType }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(1),
  maxWidth: '80%',
  wordWrap: 'break-word',
  whiteSpace: 'pre-wrap',
  alignSelf: messageType === 'user' ? 'flex-end' : 'flex-start',
  backgroundColor: messageType === 'user' ? '#e3f2fd' : '#fff',
}));

const MessageContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  overflowY: 'auto',
  padding: '16px',
});

let systemPrompt = `The user ask a question about the given documents. Please provide a summary of the question and answer in the following format:`

let assistantPrompt = `The returned JSON objects should follow this format, provide a summary first and then sub points:
{
    "Summariy_title": "Title of the summary",
    "Summary": "summarize your findings first",
    "Middle_paragraph": [
        {
            "subpoint summary": "summarize the key point in short",
            "text": "describe the subpoint in detail and add the citation for your statement in the form of [document_id]",
            "name entities": "list important entities in 'text' with document id as citation, like 'name [document1 id, document2 id]'.",
            "keywords": "list important keywords you found in the input JSON cluster with document id as citation, like 'keyword[document1 id, document2 id]'",
        },
        {
            ...
        }
    ],
}

Note you should use documents provided to you in the input JSON object.
`

// Add new component for clickable citations
const ClickableCitation = ({ citation }: { citation: string }) => {
  const dispatch = useDispatch();

  const handleCiteClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (citation.trim()) {
      console.log(`[${current()}]`+ "[Space2think] selectedCite", citation);
      dispatch(setSelectedCite(citation.trim()));
    }
  };

  return (
    <span className="highlight-cite" onMouseDown={handleCiteClick}>
      {citation}
    </span>
  );
};

// Update ClickableHighlight component
const ClickableHighlight = ({ text }: { text: string }) => {
  const dispatch = useDispatch();

  const handleHighlightClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (text.trim()) {
      // Find the container class
      let container = event.currentTarget as HTMLElement;
      while (container && 
             !container.classList.contains('editor_space') && 
             !container.classList.contains('chatbot-container') && 
             !container.classList.contains('editor-input')) {
        container = container.parentElement as HTMLElement;
      }

      if (container) {
        // Set the container class based on where the click occurred
        if (container.classList.contains('editor_space')) {
          dispatch(setSelectedContainerClass('editor_space'));
        } else if (container.classList.contains('chatbot-container')) {
          dispatch(setSelectedContainerClass('chatbot-container'));
        } else if (container.classList.contains('editor-input')) {
          dispatch(setSelectedContainerClass('editor-input'));
        }
      }
      
      dispatch(setSelectedEntity(text.trim()));
    }
  };

  return (
    <span className="llmhighlight" onMouseDown={handleHighlightClick}>
      {text}
    </span>
  );
};

// Update MessageContent component
const MessageContent = ({ text }: { text: string }) => {
  // Process citations and highlights
  const processText = (content: string) => {
    // First clean up nested and consecutive llmhighlight tags
    let processed = content;
    
    // Remove nested llmhighlight tags
    processed = processed.replace(/<llmhighlight>(\s*<llmhighlight>)+/g, '<llmhighlight>');
    
    // Clean up any stray or unmatched tags
    let hasUnmatchedTags = true;
    while (hasUnmatchedTags) {
      const before = processed;
      // Remove empty llmhighlight tags
      processed = processed.replace(/<llmhighlight>\s*<\/llmhighlight>/g, '');
      // Remove stray closing tags
      processed = processed.replace(/<\/llmhighlight>(\s*<\/llmhighlight>)*/g, '</llmhighlight>');
      // Remove stray opening tags
      processed = processed.replace(/<llmhighlight>(?![^<]*<\/llmhighlight>)/g, '');
      hasUnmatchedTags = before !== processed;
    }

    // Then mark citations
    return processed.replace(/\[(.*?)\]/g, (match, content) => {
      const citations = content.split(',').map(citation => 
        `<citation>${citation.trim()}</citation>`
      ).join(', ');
      return `[${citations}]`;
    });
  };

  // Split content into parts, preserving citations and properly formatted llmhighlight tags
  const parts = processText(text)
    .split(/(<citation>.*?<\/citation>)|(<llmhighlight>.*?<\/llmhighlight>)|(\*\*.*?\*\*)/g)
    .filter(Boolean);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('<citation>')) {
          const citation = part.replace(/<\/?citation>/g, '');
          return <ClickableCitation key={index} citation={citation} />;
        } else if (part.startsWith('<llmhighlight>')) {
          const highlightText = part.replace(/<\/?llmhighlight>/g, '');
          return <ClickableHighlight key={index} text={highlightText} />;
        } else if (part.startsWith('**')) {
          return <strong key={index}>{part.replace(/\*\*/g, '')}</strong>;
        }
        return part;
      })}
    </>
  );
};

function ChatInterface({ editorRef, currentDataset }: ChatInterfaceProps) {
  const dispatch = useDispatch();
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [currentAnswer]);

  // Add this effect to reset messages when dataset changes
  useEffect(() => {
    setCurrentQuestion('');
    setCurrentAnswer('');
    setInput('');
  }, [currentDataset]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Function to check if input is general chat
  const isGeneralChat = (input) => {
    const generalPhrases = ['hello', 'hi', 'hey', 'how are you', 'good morning', 'good afternoon', 'good evening'];
    const inputLower = input.toLowerCase();
    return generalPhrases.some(phrase => {
      const regex = new RegExp(`\\b${phrase}\\b`, 'i');
      return regex.test(inputLower);
    }) || input.trim().length < 10;  };

  // Handle general chat messages
  const handleGeneralChat = async (input: string) => {
    try {
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      if (!apiKey) throw new Error('OpenAI API key is required');

      const response = (await fetchFromOpenAi(apiKey, {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful and friendly assistant. Keep responses concise and engaging.'
          },
          {
            role: 'user',
            content: input
          }
        ]
      })) as OpenAIResponse;

      if (response?.error) {
        throw new Error(response.error.message || 'Unknown error');
      }

      return response?.choices?.[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('Error in general chat:', error);
      return 'Sorry, I encountered an error while processing your message.';
    }
  };


  const handleSend = async () => {
    if (!input.trim()) return;
    const editor = editorRef.current;

    setCurrentQuestion(input);
    setCurrentAnswer('');
    setInput('');
    setIsLoading(true);

    try {
      let assistantMessage: string;
      
      if (isGeneralChat(input)) {
        // Handle general chat
        assistantMessage = await handleGeneralChat(input);
      } else {
        // Handle dataset-specific questions using spacePrompt
        if (!editor) {
          throw new Error("Editor is not available");
        }
        
        const snapshot = editor?.store.getSnapshot();
        const userMessages = spacePrompt(snapshot);
        console.log(`[${current()}]`+ "[ChatBot] userMessages", userMessages);
        
        const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
        if (!apiKey) throw new Error('OpenAI API key is required');
        const messages = buildPromptForOpenAi(systemPrompt, assistantPrompt, input, userMessages);

        const response = (await fetchFromOpenAi(apiKey, {
          model: 'gpt-4o-mini',
          messages: messages
        })) as OpenAIResponse;
        
        if (response?.error) {
          throw new Error(response.error.message || 'Unknown error');
        }

        const responseContent = response?.choices?.[0]?.message?.content || '';
        console.log(`[${current()}]`+ "[ChatBot] responseContent", responseContent);

        const responseMessage = JSON.parse(responseContent);
        assistantMessage = responseMessage["Summary"] || '';

        if (responseMessage["Middle_paragraph"]) {
          for (const item of responseMessage["Middle_paragraph"]) {
            const title = item["subpoint summary"];
            let text = item["text"];
            
            // Helper function to escape special characters for RegExp
            const escapeRegExp = (string: string): string => {
              return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            };

            // Helper function to add word boundary to search terms
            const addWordBoundary = (term) => {
              return `\\b${escapeRegExp(term)}\\b`;
            };

            // Extract citations first to avoid highlighting them
            const citations: string[] = [];
            text = text.replace(/\[(.*?)\]/g, (match) => {
              citations.push(match);
              return `__CITATION_${citations.length - 1}__`;
            });

            // Highlight name entities
            if (item["name entities"]) {
              const entities = item["name entities"]
                .split(',')
                .map(e => e.trim().split('[')[0].trim())
                .filter(e => e);
              
              entities.forEach(entity => {
                const regex = new RegExp(addWordBoundary(entity), 'g');
                // text = text.replace(regex, `<llmhighlight>${entity}</llmhighlight>`);
              });
            }
            
            // Highlight keywords
            if (item["keywords"]) {
              const keywords = item["keywords"]
                .split(',')
                .map(k => k.trim().split('[')[0].trim())
                .filter(k => k);
              
              keywords.forEach(keyword => {
                const regex = new RegExp(addWordBoundary(keyword), 'g');
                // text = text.replace(regex, `<llmhighlight>${keyword}</llmhighlight>`);
              });
            }

            // Restore citations
            citations.forEach((citation, index) => {
              text = text.replace(`__CITATION_${index}__`, citation);
            });
            
            assistantMessage += "\n\n**" + title + "**\n" + text;
          }
        }
        console.log(`[${current()}]`+ "[ChatBot] assistantMessage", assistantMessage);
        
        // keywordsToST(editor, responseContent, dispatch);
      }

      setCurrentAnswer(assistantMessage);
    } catch (error) {
      console.error('Error processing message:', error);
      setCurrentAnswer('Sorry, there was an error processing your request.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box className='chatbot-container' sx={{ height: '105%', display: 'flex', flexDirection: 'column', p: 2 }}>
      
      <Typography 
        variant="h6" 
        sx={{ 
          mb: 2, 
          fontWeight: 'bold', 
          color: 'black',
          textAlign: 'left'
        }}
      >
        Chat Assistant
      </Typography>
      
      <MessageContainer sx={{ flexGrow: 1, bgcolor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
        {currentQuestion && (
          <MessageBox messageType="user" elevation={1}>
            <Typography
              sx={{
                '& strong, & b': { fontWeight: 'bold' },
                fontSize: '14px',
                lineHeight: 1.5,
              }}
            >
              {currentQuestion}
            </Typography>
          </MessageBox>
        )}
        
        {currentAnswer && (
          <MessageBox messageType="assistant" elevation={1}>
            <Typography
              sx={{
                '& strong, & b': { fontWeight: 'bold' },
                fontSize: '14px',
                lineHeight: 1.5,
              }}
            >
              <MessageContent text={currentAnswer} />
            </Typography>
          </MessageBox>
        )}
        
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={20} />
          </Box>
        )}
        <div ref={messagesEndRef} />
      </MessageContainer>

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          variant="outlined"
          size="small"
        />
        <Button 
          variant="contained" 
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          endIcon={<SendIcon />}
          sx={{ height: '40px', minWidth: '90px' }}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
}

export default function ChatBot({ editorRef, currentDataset }: ChatBotProps) {
  return (
    <Box sx={{ 
      display: 'flex', 
      width: '100%', 
      height: '100%'
    }}>
      <Box sx={{height: '100%', width: '100%' }}>
        <ChatInterface editorRef={editorRef} currentDataset={currentDataset} />
      </Box>
    </Box>
  );
} 

function buildPromptForOpenAi(systemPrompt: string, assistantPrompt: string, userInput: string, spacePrompt: any): GPT4Message[] {
  return [
    { role: 'system', content: systemPrompt },
    { role: 'assistant', content: assistantPrompt },
    { role: 'user', content: userInput },
    { role: 'user', content: spacePrompt.map(msg => msg.text).join('\n') }
  ];
}