/**
 * Módulo de Conteúdo (Pivô V2)
 *
 * CMS leve para textos, vídeos, imagens e PDFs.
 * Conteúdo global do admin OU mural por Founder — depende TBD-14.
 * Link de grupo WhatsApp por Founder — depende TBD-15.
 *
 * Status: SHELL — aguardando TBD-14 (escopo) e TBD-15 (validação WhatsApp)
 * Features: F-V09 (conteúdo), F-V10 (WhatsApp link)
 */

export type ContentType = 'text' | 'video' | 'image' | 'pdf' | 'whatsapp_link'

export type ContentScope = 'global' | 'founder_club'

export interface ContentAsset {
  id: string
  type: ContentType
  scope: ContentScope          // depende TBD-14
  owner_id?: string            // founder_member_id se scope=founder_club
  title: string
  body?: string
  url?: string
  published_at?: string
}

// TODO(F-V09): listForMember(memberId)
// TODO(F-V09): publishGlobal(asset)
// TODO(F-V10): setFounderWhatsappLink(memberId, url) — depende TBD-15
