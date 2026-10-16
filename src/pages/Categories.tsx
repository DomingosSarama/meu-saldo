import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { Category, Snapshot } from '../models/finance';
import { CategoryIcon } from '../components/Icon';
export function Categories({
  s,
  edit,
  remove,
}: {
  s: Snapshot;
  edit: (c: Category) => void;
  remove: (c: Category) => void;
}) {
  const [kind, setKind] = useState<'expense' | 'income'>('expense');
  return (
    <>
      <div className="page-intro">
        <p>
          As tuas finanças têm a tua personalidade. Escolhe categorias, ícones e cores que fazem
          sentido para ti.
        </p>
        <div className="segmented">
          <button
            onClick={() => setKind('expense')}
            className={kind === 'expense' ? 'active' : ''}
            aria-pressed={kind === 'expense'}
          >
            Despesas
          </button>
          <button
            onClick={() => setKind('income')}
            className={kind === 'income' ? 'active' : ''}
            aria-pressed={kind === 'income'}
          >
            Receitas
          </button>
        </div>
      </div>
      <div className="category-grid">
        {s.categories
          .filter((c) => c.kind === kind)
          .map((c) => (
            <section className="panel category-card" key={c.id}>
              <CategoryIcon category={c} />
              <div>
                <h2>{c.name}</h2>
                <p>{c.subcategories.length ? c.subcategories.join(' · ') : 'Sem subcategorias'}</p>
              </div>
              <div className="row-actions">
                <button
                  className="icon-button"
                  aria-label={`Editar ${c.name}`}
                  onClick={() => edit(c)}
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Eliminar ${c.name}`}
                  onClick={() => remove(c)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </section>
          ))}
      </div>
      <p className="footnote">
        Ao remover uma categoria, é obrigatório reclassificar os movimentos. O histórico é
        preservado.
      </p>
    </>
  );
}
