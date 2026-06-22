-- =============================================================================
-- FocusFlow — Seed data
-- Safe to re-run: every insert is upserted on a stable natural key.
-- =============================================================================

insert into public.subscription_plans (name, price, description, features, is_active)
values
  (
    'Free',
    0.00,
    'Get started with the essentials of FocusFlow.',
    '- 1 active goal' || E'\n' ||
    '- Daily AI-generated tasks' || E'\n' ||
    '- Basic progress tracking',
    true
  ),
  (
    'Pro',
    9.99,
    'For users who want deeper insight and unlimited goals.',
    '- Unlimited goals' || E'\n' ||
    '- Weekly AI insights' || E'\n' ||
    '- Progress analytics' || E'\n' ||
    '- Priority chatbot access',
    true
  ),
  (
    'Premium',
    19.99,
    'The full FocusFlow experience with coaching-grade analytics.',
    '- Everything in Pro' || E'\n' ||
    '- Personalized AI coaching prompts' || E'\n' ||
    '- Advanced analytics & exports' || E'\n' ||
    '- Early access to new features',
    true
  )
on conflict (name) do update
set price       = excluded.price,
    description = excluded.description,
    features    = excluded.features,
    is_active   = excluded.is_active;
