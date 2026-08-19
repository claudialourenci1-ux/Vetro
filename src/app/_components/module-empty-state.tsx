import { DatabaseZap } from 'lucide-react'

export function ModuleEmptyState({ label, count, error }: { label: string; count: number | null; error?: boolean }) {
  if (error) return <section className="empty-state"><DatabaseZap size={22} /><div><h2>Não foi possível carregar {label.toLowerCase()}.</h2><p>Seu acesso continua protegido. Tente novamente ou confirme as permissões deste workspace.</p></div></section>
  return <section className="empty-state"><DatabaseZap size={22} /><div><h2>{count === 0 ? `Nenhum registro de ${label.toLowerCase()} ainda.` : `${count ?? 0} registros disponíveis.`}</h2><p>{count === 0 ? 'Quando houver dados importados ou cadastrados, eles aparecerão nesta área.' : 'A visualização operacional detalhada será disponibilizada na próxima etapa.'}</p></div></section>
}
