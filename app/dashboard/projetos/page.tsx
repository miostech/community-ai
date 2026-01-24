'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ProjetosPage() {
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    // Carregar projetos do localStorage
    try {
      const savedProjects = JSON.parse(localStorage.getItem('projects') || '[]');
      setProjects(savedProjects);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      setProjects([]);
    }
  }, []);
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Meus Projetos</h1>
          <p className="text-sm sm:text-base text-gray-600">Organize e acesse seus conteúdos criados</p>
        </div>
        <Button className="w-full sm:w-auto">Novo Projeto</Button>
      </div>

      {projects.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum projeto ainda
          </h3>
          <p className="text-gray-600 mb-6">
            Comece criando seu primeiro conteúdo
          </p>
          <Button>Criar Conteúdo</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-1">
                    {project.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">{project.platform}</p>
                </div>
                <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-500">
                  <p>{project.items} itens</p>
                  <p>Modificado em {new Date(project.lastModified).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex gap-2 pt-3 sm:pt-4 border-t border-gray-200">
                  <Link href={`/dashboard/projetos/${project.id}`} className="flex-1">
                    <Button variant="ghost" size="sm" className="w-full text-xs sm:text-sm">
                      Abrir
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      const updatedProjects = projects.filter(p => p.id !== project.id);
                      localStorage.setItem('projects', JSON.stringify(updatedProjects));
                      setProjects(updatedProjects);
                    }}
                    className="text-xs sm:text-sm"
                  >
                    ⋮
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
