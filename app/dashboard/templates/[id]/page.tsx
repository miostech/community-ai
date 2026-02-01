'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Código de Template individual comentado - não está em uso no momento
/*
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const templateConfigs: Record<string, {...}> = {
  reels: { title: 'Roteiro para Reels', ... },
  viral: { title: 'Ideia de Post Viral', ... },
  storytelling: { title: 'Storytelling Pessoal', ... },
  educational: { title: 'Conteúdo Educativo Rápido', ... },
  sales: { title: 'Venda sem Parecer Venda', ... },
  carousel: { title: 'Carrossel Informativo', ... },
};

export default function TemplatePage() {
  // ... formulário com perguntas, geração de conteúdo, etc.
}
*/

export default function TemplatePage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona para o dashboard (Templates não está em uso no momento)
    router.replace('/dashboard');
  }, [router]);

  return null;
}
