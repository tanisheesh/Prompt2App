
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, MicOff, Download, RefreshCw, Eraser, Zap, Loader2, Sparkles, Eye, Code, Heart } from 'lucide-react';
import { generateApp, GenerateAppInput, GenerateAppOutput } from '@/ai/flows/app-generator';
import { useToast } from "@/hooks/use-toast";

// Declare SpeechRecognition types for window object
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function HomePage() {
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const speechRecognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      speechRecognitionRef.current = new SpeechRecognitionAPI();
      speechRecognitionRef.current.continuous = false;
      speechRecognitionRef.current.interimResults = false;
      speechRecognitionRef.current.lang = 'en-US';

      speechRecognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setPrompt(prevPrompt => prevPrompt ? `${prevPrompt} ${transcript}` : transcript);
        setIsListening(false);
      };

      speechRecognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        toast({
          variant: "destructive",
          title: "Voice Input Error",
          description: event.error === 'no-speech' ? "No speech detected. Please try again." : "An error occurred with voice input.",
        });
        setIsListening(false);
      };

      speechRecognitionRef.current.onend = () => {
        // setIsListening(false); // Already handled by onresult and onerror
      };
    } else {
      console.warn('Speech Recognition API not supported in this browser.');
    }

    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    };
  }, [toast]);

  const handleToggleListening = () => {
    if (!speechRecognitionRef.current) {
      toast({
        variant: "destructive",
        title: "Voice Input Not Supported",
        description: "Your browser does not support voice input.",
      });
      return;
    }

    if (isListening) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    } else {
      speechRecognitionRef.current.start();
      setIsListening(true);
    }
  };

  const performAppGeneration = useCallback(async (currentPrompt: string) => {
    if (!currentPrompt.trim()) {
      toast({
        variant: "destructive",
        title: "Prompt is empty",
        description: "Please enter a description for your app.",
      });
      return;
    }

    setIsLoading(true);
    setGeneratedCode(null);
    
    try {
      const input: GenerateAppInput = { prompt: currentPrompt };
      const output: GenerateAppOutput = await generateApp(input);
      if (output && output.code) {
        setGeneratedCode(output.code);
      } else {
        throw new Error("AI did not return any code.");
      }
    } catch (err: any) {
      console.error('Error generating app:', err);
      toast({
        variant: "destructive",
        title: "App Generation Failed",
        description: err.message || "An unexpected error occurred. Please try again.",
      });
      setGeneratedCode(null);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleGenerateApp = () => {
    performAppGeneration(prompt);
  };

  const handleRegenerateApp = () => {
    performAppGeneration(prompt);
  };

  const handleClearPreview = () => {
    setGeneratedCode(null);
  };

  const handleSaveApp = () => {
    if (!generatedCode) {
      toast({
        variant: "destructive",
        title: "No Code to Save",
        description: "Please generate an app preview first.",
      });
      return;
    }
    const blob = new Blob([generatedCode], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'prompt2app_preview.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast({
      title: "HTML Saved",
      description: "The generated HTML preview has been downloaded.",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 md:p-8 transition-all duration-300 ease-in-out">
      <header className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary flex items-center justify-center">
          <Sparkles className="inline-block mr-2 h-10 w-10 md:h-12 md:w-12 text-accent" /> Prompt<span className="text-accent">2</span>App
        </h1>
        <p className="text-muted-foreground mt-2 text-md md:text-lg max-w-xl">
          Turn your app ideas into reality. Describe your app, and let AI craft the HTML preview for you.
        </p>
      </header>

      <Card className="w-full max-w-2xl mb-8 shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Describe Your App</CardTitle>
          <CardDescription>Enter a natural language prompt (e.g., 'a daily planner with voice reminders' or 'a basic calculator').</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Textarea
              id="prompt-textarea"
              placeholder="e.g., A simple to-do list app with add, remove, and mark as complete features..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              className="text-base p-3 focus:ring-accent"
              aria-label="App description prompt"
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={handleToggleListening} 
                variant="outline" 
                className="w-full sm:w-auto"
                aria-label={isListening ? "Stop voice input" : "Start voice input"}
                disabled={!speechRecognitionRef.current}
              >
                {isListening ? <MicOff className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
                {isListening ? 'Listening...' : 'Use Voice'}
              </Button>
              <Button 
                onClick={handleGenerateApp} 
                className="w-full sm:flex-grow bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3"
                disabled={isLoading}
                aria-label="Create App"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-5 w-5" />
                )}
                Create App
              </Button>
            </div>
             {!speechRecognitionRef.current && (
                <p className="text-xs text-muted-foreground text-center sm:text-left">Voice input may not be supported in your browser.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {(isLoading || generatedCode) && (
        <section className="w-full max-w-3xl animate-fadeIn mt-6">
          {generatedCode && !isLoading && (
            <div className="flex flex-wrap gap-2 mb-4 justify-center">
              <Button onClick={handleRegenerateApp} variant="outline" disabled={isLoading}>
                <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
              </Button>
              <Button onClick={handleClearPreview} variant="outline" disabled={isLoading}>
                <Eraser className="mr-2 h-4 w-4" /> Clear
              </Button>
              <Button onClick={handleSaveApp} variant="outline" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading || !generatedCode}>
                <Download className="mr-2 h-4 w-4" /> Save HTML
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center p-10 bg-card rounded-lg shadow-md">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg text-muted-foreground font-medium">Generating your app preview, please wait...</p>
              <p className="text-sm text-muted-foreground">This might take a moment.</p>
            </div>
          )}

          {generatedCode && !isLoading && (
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="preview"><Eye className="mr-2 h-4 w-4" />Preview</TabsTrigger>
                <TabsTrigger value="code"><Code className="mr-2 h-4 w-4" />Code</TabsTrigger>
              </TabsList>
              <TabsContent value="preview">
                <Card className="shadow-xl">
                  <CardHeader>
                    <CardTitle className="font-headline text-2xl">Live Preview</CardTitle>
                    <CardDescription>This is an interactive HTML preview of the generated application.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <iframe
                      srcDoc={generatedCode || ""}
                      title="Generated App Preview"
                      className="w-full h-[500px] border rounded-md bg-white"
                      sandbox="allow-scripts allow-forms allow-popups"
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="code">
                <Card className="shadow-xl">
                  <CardHeader>
                    <CardTitle className="font-headline text-2xl">Generated HTML Code</CardTitle>
                    <CardDescription>Review the AI-generated HTML for the preview. You can save it locally.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] w-full border rounded-md p-1 bg-gray-900 dark:bg-gray-800">
                      <pre><code className="font-code text-sm text-gray-100 whitespace-pre-wrap break-all">{generatedCode}</code></pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </section>
      )}
       <footer className="mt-12 py-6 text-center text-sm text-muted-foreground border-t w-full">
          <p className="flex items-center justify-center">
            Made with <Heart className="inline-block h-4 w-4 mx-1 text-red-500 fill-current" /> by&nbsp;
            <a href="https://github.com/nidhi-nayana" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Nidhi</a>,&nbsp;
            <a href="https://github.com/nishant-codess" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Nishant</a>&nbsp;&amp;&nbsp;
            <a href="https://github.com/tanisheesh" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Tanish</a>
          </p>
          <p className="mt-2">&copy; {new Date().getFullYear()} Prompt2App. Powered by Generative AI.</p>
        </footer>
    </div>
  );
}
