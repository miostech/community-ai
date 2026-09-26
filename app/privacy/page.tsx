'use client';

import { Box, Container, Typography } from '@mui/material';

export default function PrivacyPage() {
    return (
        <Container maxWidth="md" sx={{ py: 6 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
                Política de Privacidade
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 4 }}>
                Última atualização: 26 de setembro de 2026
            </Typography>

            <Section title="1. Introdução">
                A Dome (&quot;nós&quot;, &quot;nosso&quot; ou &quot;plataforma&quot;) é uma comunidade online voltada para criadores de conteúdo.
                Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações
                pessoais quando você utiliza nossa plataforma, acessível pelo domínio dome.app.br.
            </Section>

            <Section title="2. Dados que coletamos">
                <B>Dados de cadastro:</B> nome, endereço de e-mail e foto de perfil fornecidos durante o registro
                via Google ou Apple ID.
                {'\n\n'}
                <B>Dados de perfil:</B> informações que você escolhe adicionar ao seu perfil, como redes sociais,
                biografia e portfólio.
                {'\n\n'}
                <B>Dados de uso:</B> interações na plataforma, participação em lives, mensagens no chat,
                conversas com a assistente de IA e navegação geral.
                {'\n\n'}
                <B>Dados técnicos:</B> endereço IP, tipo de navegador, sistema operacional e informações
                de dispositivo, coletados automaticamente para fins de segurança e melhoria do serviço.
            </Section>

            <Section title="3. Como usamos seus dados">
                Utilizamos suas informações para: fornecer e manter a plataforma funcionando,
                personalizar sua experiência, enviar notificações relevantes sobre lives e conteúdos,
                melhorar nossos serviços por meio de análises de uso, garantir a segurança da plataforma
                e cumprir obrigações legais.
            </Section>

            <Section title="4. Assistente de IA">
                A Dome oferece uma assistente de IA integrada. As conversas com a assistente são armazenadas
                para manter o histórico e melhorar as respostas. A assistente pode realizar buscas na web
                para fornecer informações atualizadas. Não compartilhamos o conteúdo das suas conversas
                com terceiros, exceto com o provedor do modelo de IA (Anthropic) para processamento das respostas,
                conforme necessário para o funcionamento do serviço.
            </Section>

            <Section title="5. Lives e gravações">
                As lives realizadas na plataforma podem ser gravadas e disponibilizadas para visualização posterior.
                As gravações são hospedadas no YouTube como vídeos não listados, acessíveis apenas por quem possui
                o link dentro da plataforma. Ao participar de uma live, você concorda que sua imagem e voz podem
                ser gravadas.
            </Section>

            <Section title="6. Compartilhamento de dados">
                Não vendemos suas informações pessoais. Podemos compartilhar dados com: provedores de serviço
                que nos auxiliam na operação da plataforma (hospedagem, armazenamento, processamento de IA),
                autoridades competentes quando exigido por lei, e outros usuários da plataforma conforme as
                informações que você tornar públicas no seu perfil.
            </Section>

            <Section title="7. Armazenamento e segurança">
                Seus dados são armazenados em servidores seguros com criptografia em trânsito e em repouso.
                Utilizamos provedores de infraestrutura reconhecidos (Vercel, MongoDB Atlas, Microsoft Azure)
                para garantir a disponibilidade e proteção dos dados. Mantemos seus dados enquanto sua conta
                estiver ativa ou conforme necessário para cumprir obrigações legais.
            </Section>

            <Section title="8. Seus direitos">
                Conforme a Lei Geral de Proteção de Dados (LGPD), você tem direito a: acessar seus dados pessoais,
                corrigir dados incompletos ou desatualizados, solicitar a exclusão dos seus dados,
                revogar o consentimento a qualquer momento e solicitar a portabilidade dos seus dados.
                Para exercer qualquer um desses direitos, entre em contato conosco pelo e-mail indicado abaixo.
            </Section>

            <Section title="9. Cookies">
                Utilizamos cookies essenciais para autenticação e funcionamento da plataforma.
                Não utilizamos cookies de rastreamento publicitário.
            </Section>

            <Section title="10. Alterações nesta política">
                Podemos atualizar esta Política de Privacidade periodicamente. Alterações significativas
                serão comunicadas por meio da plataforma. O uso continuado após as alterações constitui
                aceitação da política atualizada.
            </Section>

            <Section title="11. Contato">
                Em caso de dúvidas sobre esta Política de Privacidade ou sobre o tratamento dos seus dados,
                entre em contato pelo e-mail: contato@dome.app.br
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
            <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                {children}
            </Typography>
        </Box>
    );
}

function B({ children }: { children: React.ReactNode }) {
    return <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{children}</Box>;
}
