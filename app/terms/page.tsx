'use client';

import { Box, Container, Typography } from '@mui/material';

export default function TermsPage() {
    return (
        <Container maxWidth="md" sx={{ py: 6 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
                Termos de Uso
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 4 }}>
                Última atualização: 26 de setembro de 2026
            </Typography>

            <Section title="1. Aceitação dos termos">
                Ao acessar e utilizar a plataforma Dome (dome.app.br), você concorda com estes Termos de Uso.
                Caso não concorde, não utilize a plataforma.
            </Section>

            <Section title="2. Descrição do serviço">
                A Dome é uma comunidade online voltada para criadores de conteúdo, oferecendo ferramentas como
                lives interativas, assistente de IA, portfólio, chat e networking entre membros.
            </Section>

            <Section title="3. Cadastro e conta">
                Para utilizar a plataforma, é necessário criar uma conta via Google ou Apple ID.
                Você é responsável por manter a segurança da sua conta e por todas as atividades
                realizadas sob ela. Informações falsas ou enganosas no perfil podem resultar em suspensão da conta.
            </Section>

            <Section title="4. Regras de conduta">
                Ao utilizar a Dome, você se compromete a: não publicar conteúdo ofensivo, ilegal ou que viole
                direitos de terceiros, não assediar outros membros, não utilizar a plataforma para spam ou
                atividades comerciais não autorizadas, respeitar as diretrizes da comunidade e tratar todos
                os membros com respeito.
            </Section>

            <Section title="5. Conteúdo do usuário">
                Você mantém a propriedade do conteúdo que publica na plataforma. Ao publicar conteúdo,
                você concede à Dome uma licença não exclusiva para exibir esse conteúdo dentro da plataforma.
                Gravações de lives podem ser armazenadas e disponibilizadas para visualização posterior
                pelos membros da comunidade.
            </Section>

            <Section title="6. Propriedade intelectual">
                Todo o conteúdo da plataforma (design, código, marca, textos institucionais) é propriedade
                da Dome. Os cursos, aulas e materiais educativos disponibilizados são propriedade dos
                respectivos criadores e protegidos por direitos autorais.
            </Section>

            <Section title="7. Assistente de IA">
                A assistente de IA é uma ferramenta de apoio e suas respostas são geradas automaticamente.
                As informações fornecidas pela IA não substituem orientação profissional.
                A Dome não se responsabiliza por decisões tomadas com base nas respostas da assistente.
            </Section>

            <Section title="8. Limitação de responsabilidade">
                A Dome é fornecida &quot;como está&quot;. Não garantimos disponibilidade ininterrupta,
                ausência de erros ou que o serviço atenderá todas as suas expectativas.
                Não nos responsabilizamos por danos indiretos resultantes do uso da plataforma.
            </Section>

            <Section title="9. Suspensão e encerramento">
                Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos ou
                as diretrizes da comunidade, a qualquer momento e sem aviso prévio.
                Você pode encerrar sua conta a qualquer momento entrando em contato conosco.
            </Section>

            <Section title="10. Alterações nos termos">
                Podemos atualizar estes Termos de Uso periodicamente. Alterações significativas serão
                comunicadas pela plataforma. O uso continuado após as alterações constitui aceitação
                dos termos atualizados.
            </Section>

            <Section title="11. Legislação aplicável">
                Estes termos são regidos pelas leis da República Federativa do Brasil.
                Qualquer disputa será resolvida no foro da comarca de domicílio do usuário.
            </Section>

            <Section title="12. Contato">
                Em caso de dúvidas sobre estes Termos de Uso, entre em contato pelo e-mail: contato@dome.app.br
            </Section>
        </Container>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {title}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                {children}
            </Typography>
        </Box>
    );
}
