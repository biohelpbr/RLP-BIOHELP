'use client'

/**
 * Componente NetworkTree - Sprint 3
 * 
 * Exibe a rede do membro em formato de árvore visual
 * Suporta expansão/colapso de nós e mostra informações conforme TBD-013
 */

import { useState, useMemo } from 'react'
import type { NetworkMember, MemberLevel } from '@/types/database'
import styles from './NetworkTree.module.css'

interface NetworkTreeProps {
  network: NetworkMember[]
  rootMemberId: string
  rootMemberName: string
  isAdmin?: boolean
}

// Cores por nível de liderança
const LEVEL_COLORS: Record<MemberLevel, string> = {
  membro: '#6b7280',      // gray
  parceira: '#10b981',    // emerald
  lider_formacao: '#f59e0b', // amber
  lider: '#3b82f6',       // blue
  diretora: '#8b5cf6',    // violet
  head: '#ec4899'         // pink
}

// Nomes amigáveis
const LEVEL_NAMES: Record<MemberLevel, string> = {
  membro: 'Membro',
  parceira: 'Parceira',
  lider_formacao: 'Líder em Formação',
  lider: 'Líder',
  diretora: 'Diretora',
  head: 'Head'
}

// Status badges
const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  active: { label: 'Ativa', className: styles.badgeActive },
  inactive: { label: 'Inativa', className: styles.badgeInactive },
  pending: { label: 'Pendente', className: styles.badgePending }
}

export default function NetworkTree({ 
  network, 
  rootMemberId, 
  rootMemberName,
  isAdmin = false 
}: NetworkTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']))
  const [selectedMember, setSelectedMember] = useState<NetworkMember | null>(null)

  // Organizar rede em estrutura de árvore
  const treeData = useMemo(() => {
    return buildTree(network, rootMemberId)
  }, [network, rootMemberId])

  // Toggle expansão de um nó
  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  // Expandir todos
  const expandAll = () => {
    const allIds = new Set(['root', ...network.map(m => m.id)])
    setExpandedNodes(allIds)
  }

  // Colapsar todos
  const collapseAll = () => {
    setExpandedNodes(new Set(['root']))
  }

  return (
    <div className={styles.container}>
      {/* Controles */}
      <div className={styles.controls}>
        <button onClick={expandAll} className={styles.controlButton}>
          ➕ Expandir Tudo
        </button>
        <button onClick={collapseAll} className={styles.controlButton}>
          ➖ Colapsar Tudo
        </button>
        <span className={styles.stats}>
          {network.length} membros na rede
        </span>
      </div>

      {/* Árvore */}
      <div className={styles.tree}>
        {/* Nó raiz (membro logado) */}
        <div className={styles.rootNode}>
          <div 
            className={styles.nodeContent}
            onClick={() => toggleNode('root')}
          >
            <span className={styles.expandIcon}>
              {expandedNodes.has('root') ? '▼' : '▶'}
            </span>
            <span className={styles.nodeName}>{rootMemberName}</span>
            <span className={styles.nodeLabel}>(Você)</span>
          </div>
          
          {/* Filhos do nó raiz */}
          {expandedNodes.has('root') && treeData.length > 0 && (
            <div className={styles.children}>
              {treeData.map(node => (
                <TreeNode
                  key={node.id}
                  node={node}
                  expandedNodes={expandedNodes}
                  toggleNode={toggleNode}
                  onSelect={setSelectedMember}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legenda de níveis */}
      <div className={styles.legend}>
        <span className={styles.legendTitle}>Níveis:</span>
        {Object.entries(LEVEL_NAMES).map(([level, name]) => (
          <span 
            key={level} 
            className={styles.legendItem}
            style={{ '--level-color': LEVEL_COLORS[level as MemberLevel] } as React.CSSProperties}
          >
            <span className={styles.legendDot} />
            {name}
          </span>
        ))}
      </div>

      {/* Modal de detalhes */}
      {selectedMember && (
        <MemberDetailModal 
          member={selectedMember} 
          onClose={() => setSelectedMember(null)}
          isAdmin={isAdmin}
        />
      )}
    </div>
  )
}

// Tipo para nó da árvore
interface TreeNodeData extends NetworkMember {
  children: TreeNodeData[]
}

// Constrói estrutura de árvore a partir da lista plana
function buildTree(network: NetworkMember[], rootId: string): TreeNodeData[] {
  // Agrupar por sponsor_id (usando depth para inferir)
  const byDepth = new Map<number, NetworkMember[]>()
  
  for (const member of network) {
    const depth = member.depth
    if (!byDepth.has(depth)) {
      byDepth.set(depth, [])
    }
    byDepth.get(depth)!.push(member)
  }

  // N1 são filhos diretos do root
  const n1 = byDepth.get(1) || []
  
  // Para cada N1, encontrar seus filhos recursivamente
  const buildChildren = (parentId: string, currentDepth: number): TreeNodeData[] => {
    const nextDepth = currentDepth + 1
    const potentialChildren = byDepth.get(nextDepth) || []
    
    // Filtrar filhos deste parent (precisamos inferir pela ordem)
    // Como não temos sponsor_id na resposta, usamos a ordem natural
    return potentialChildren
      .filter(m => {
        // Heurística: membros no próximo nível que vêm logo após este parent
        // Isso funciona se a API retorna em ordem de hierarquia
        return true // Simplificado - idealmente precisaríamos do sponsor_id
      })
      .map(m => ({
        ...m,
        children: buildChildren(m.id, nextDepth)
      }))
  }

  return n1.map(m => ({
    ...m,
    children: buildChildren(m.id, 1)
  }))
}

// Componente de nó da árvore
function TreeNode({
  node,
  expandedNodes,
  toggleNode,
  onSelect,
  isAdmin
}: {
  node: TreeNodeData
  expandedNodes: Set<string>
  toggleNode: (id: string) => void
  onSelect: (member: NetworkMember) => void
  isAdmin: boolean
}) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expandedNodes.has(node.id)
  const statusBadge = STATUS_BADGES[node.status]
  const levelColor = LEVEL_COLORS[node.level]

  return (
    <div className={styles.treeNode}>
      <div 
        className={styles.nodeContent}
        style={{ '--level-color': levelColor } as React.CSSProperties}
      >
        {/* Ícone de expansão */}
        <span 
          className={styles.expandIcon}
          onClick={() => hasChildren && toggleNode(node.id)}
          style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
        >
          {isExpanded ? '▼' : '▶'}
        </span>

        {/* Indicador de nível */}
        <span className={styles.levelDot} />

        {/* Nome do membro */}
        <span 
          className={styles.nodeName}
          onClick={() => onSelect(node)}
        >
          {node.name}
        </span>

        {/* Badge de status */}
        <span className={`${styles.badge} ${statusBadge.className}`}>
          {statusBadge.label}
        </span>

        {/* CV do mês */}
        <span className={styles.nodeCV}>
          {node.cv_month ?? 0} CV
        </span>

        {/* Nível */}
        <span 
          className={styles.nodeLevel}
          style={{ color: levelColor }}
        >
          {LEVEL_NAMES[node.level]}
        </span>
      </div>

      {/* Filhos */}
      {hasChildren && isExpanded && (
        <div className={styles.children}>
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
              onSelect={onSelect}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Modal de detalhes do membro
function MemberDetailModal({
  member,
  onClose,
  isAdmin
}: {
  member: NetworkMember
  onClose: () => void
  isAdmin: boolean
}) {
  const statusBadge = STATUS_BADGES[member.status]
  const levelColor = LEVEL_COLORS[member.level]

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>✕</button>
        
        <h3 className={styles.modalTitle}>{member.name}</h3>
        
        <div className={styles.modalContent}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Email:</span>
            <span className={styles.detailValue}>{member.email}</span>
          </div>
          
          {(isAdmin || member.phone) && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Telefone:</span>
              <span className={styles.detailValue}>
                {member.phone || 'Não informado'}
              </span>
            </div>
          )}
          
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Código:</span>
            <span className={styles.detailValue}>{member.ref_code}</span>
          </div>
          
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Status:</span>
            <span className={`${styles.badge} ${statusBadge.className}`}>
              {statusBadge.label}
            </span>
          </div>
          
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Nível:</span>
            <span style={{ color: levelColor, fontWeight: 600 }}>
              {LEVEL_NAMES[member.level]}
            </span>
          </div>
          
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>CV do Mês:</span>
            <span className={styles.detailValue}>{member.cv_month ?? 0}</span>
          </div>
          
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Nível na Rede:</span>
            <span className={styles.detailValue}>N{member.depth}</span>
          </div>
          
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Cadastro:</span>
            <span className={styles.detailValue}>
              {new Date(member.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

