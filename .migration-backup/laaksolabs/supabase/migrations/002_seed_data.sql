-- Seed clients
insert into clients (name, owner_name, division, status, retainer_amount, phone, email, location, services, notes) values
  ('Polish & Shine Exteriors', 'Dom', 'div1', 'onboarding', null, '(253) 237-2709', 'polishandshineexteriors@gmail.com', 'Federal Way, WA', array['meta_ads', 'google_ads', 'brand_kit'], 'First Div 1 client. Pressure washing, windows, gutters.'),
  ('MemeMint', null, 'div3', 'active', null, null, null, null, array[]::text[], 'Equity deal.'),
  ('Cascade Home Remodeling', null, 'div1', 'paused', null, null, null, null, array['meta_ads'], null);

-- Seed contacts
insert into contacts (name, role, company, phone, email, client_id, notes)
select 'Dom', 'Client Owner', 'Polish & Shine Exteriors', '(253) 237-2709', 'polishandshineexteriors@gmail.com', id, 'Owner/operator. Good communicator.'
from clients where name = 'Polish & Shine Exteriors';

insert into contacts (name, role, company, notes) values
  ('Ryan', 'White-Label Partner', 'Happy Dog Media Group', 'Trevor''s former Creative Director from Renewal by Andersen. Handles creative fulfillment.');

-- Seed Happy Dog orders (linked to Polish & Shine)
insert into happydog_orders (client_id, deliverable, status, hd_cost, client_price, notes)
select id, 'Brand Kit Refresh', 'not_ordered', 2500, 5500, 'Full brand kit. Range $5-6K to client.' from clients where name = 'Polish & Shine Exteriors';

insert into happydog_orders (client_id, deliverable, status, hd_cost, client_price, notes)
select id, 'Landing Page — Windows', 'not_ordered', 1500, 4000, 'Window cleaning landing page. Range $3-5K to client.' from clients where name = 'Polish & Shine Exteriors';

insert into happydog_orders (client_id, deliverable, status, hd_cost, client_price, notes)
select id, 'Landing Page — Gutters', 'not_ordered', 1500, 4000, 'Gutter cleaning landing page. Range $3-5K to client.' from clients where name = 'Polish & Shine Exteriors';

insert into happydog_orders (client_id, deliverable, status, hd_cost, client_price, notes)
select id, 'Meta Ad Creative Batch', 'not_ordered', 750, null, 'First batch of Meta ad creatives.' from clients where name = 'Polish & Shine Exteriors';

-- Seed tasks
insert into tasks (title, priority, status, category, due_date, client_id)
select 'Set retainer price with Dom', 'urgent', 'todo', 'sales', current_date, id
from clients where name = 'Polish & Shine Exteriors';

insert into tasks (title, priority, status, category, client_id)
select 'Connect Meta MCP to Dom''s ad account', 'high', 'todo', 'campaigns', id
from clients where name = 'Polish & Shine Exteriors';

insert into tasks (title, priority, status, category, client_id)
select 'Commission Happy Dog for brand kit + landing pages', 'high', 'todo', 'creative', id
from clients where name = 'Polish & Shine Exteriors';

insert into tasks (title, priority, status, category, client_id)
select 'Launch Meta campaigns for windows + gutters', 'high', 'todo', 'campaigns', id
from clients where name = 'Polish & Shine Exteriors';

insert into tasks (title, priority, status, category, client_id)
select 'Draft scope brief for Ryan', 'medium', 'todo', 'creative', id
from clients where name = 'Polish & Shine Exteriors';

insert into tasks (title, priority, status, category, client_id)
select 'Set up Google Ads for Federal Way', 'medium', 'todo', 'campaigns', id
from clients where name = 'Polish & Shine Exteriors';

insert into tasks (title, priority, status, category)
values ('Build reporting workflow', 'medium', 'todo', 'operations');
