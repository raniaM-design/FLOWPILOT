"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface LegalSection {
  title: string;
  content: string;
}

interface LegalPageProps {
  titleKey: string;
  descriptionKey: string;
  sectionsKey: string;
}

export function LegalPage({ titleKey, descriptionKey, sectionsKey }: LegalPageProps) {
  const t = useTranslations("legal");
  const title = t(`${titleKey}.title`);
  const description = t(`${titleKey}.description`);
  const sections = t.raw(`${titleKey}.sections`) as Record<string, LegalSection>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && (
          <p className="text-lg text-slate-600 leading-relaxed">{description}</p>
        )}
      </div>

      <Separator />

      <div className="space-y-8">
        {sections &&
          Object.entries(sections).map(([key, section]) => (
            <Card key={key} className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-slate-900">
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-slate max-w-none">
                  {(() => {
                    const lines = section.content.split("\n");
                    const elements: React.ReactNode[] = [];
                    let i = 0;
                    
                    while (i < lines.length) {
                      const line = lines[i].trim();
                      
                      if (line === "") {
                        i++;
                        continue;
                      }
                      
                      // Détecter les listes (lignes commençant par -)
                      if (line.startsWith("-")) {
                        const listItems: string[] = [];
                        while (i < lines.length && lines[i].trim().startsWith("-")) {
                          listItems.push(lines[i].trim().substring(1).trim());
                          i++;
                        }
                        
                        elements.push(
                          <ul key={`list-${i}`} className="list-disc list-inside space-y-2 my-4 ml-4">
                            {listItems.map((item, itemIndex) => (
                              <li key={itemIndex} className="text-slate-700 leading-relaxed">
                                {item}
                              </li>
                            ))}
                          </ul>
                        );
                      } else {
                        // Paragraphe normal
                        elements.push(
                          <p key={`para-${i}`} className="text-slate-700 leading-relaxed mb-4">
                            {line}
                          </p>
                        );
                        i++;
                      }
                    }
                    
                    return elements;
                  })()}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}

