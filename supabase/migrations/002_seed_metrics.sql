-- Seed metrics with February 2026 data
insert into metrics (metric_name, section, what_it_tells_you, target, last_month_value, this_month_value, trend, sort_order)
values
  -- SEO
  ('Keywords Page 1 VIC', 'SEO', 'Number of target VIC keywords ranking on Google Page 1', '50', '18', '21', 'up', 1),
  ('Keywords Page 1 QLD', 'SEO', 'Number of target QLD keywords ranking on Google Page 1', '30', '7', '9', 'up', 2),
  ('Organic Sessions', 'SEO', 'Monthly website visits from organic search', '2000', '999', '1120', 'up', 3),
  ('Organic Revenue + Enquiries', 'SEO', 'Combined revenue and enquiry value attributed to organic search', '$15,000+', '$8,200', '$9,400', 'up', 4),

  -- PAID
  ('Google Ads Cost Per Enquiry', 'PAID', 'Average cost to generate one enquiry via Google Ads', '<$80', '$112', '$98', 'up', 5),
  ('Google Ads ROAS', 'PAID', 'Return on ad spend for Google Ads campaigns', '4x', '2.8x', '3.1x', 'up', 6),
  ('Meta Ads Cost Per Enquiry', 'PAID', 'Average cost to generate one enquiry via Meta (Facebook/Instagram) Ads', '<$90', '$145', '$128', 'up', 7),
  ('Meta Ads ROAS', 'PAID', 'Return on ad spend for Meta Ads campaigns', '3x', '1.9x', '2.2x', 'up', 8),

  -- CHANNEL HEALTH
  ('Organic % of Total Revenue', 'CHANNEL HEALTH', 'Proportion of total revenue driven by organic search vs paid', '40%', '28%', '31%', 'up', 9),
  ('Call Tracked Enquiries by Channel', 'CHANNEL HEALTH', 'Number of tracked phone enquiries broken down by marketing channel', '100/mo', '67', '74', 'up', 10),

  -- LOCAL GEO
  ('GBP Calls + Direction Requests', 'LOCAL GEO', 'Monthly calls and direction requests from Google Business Profiles', '200/mo', '143', '158', 'up', 11),
  ('GBP Reviews Count and Rating', 'LOCAL GEO', 'Total Google reviews and average star rating across all locations', '4.5★ / 200+', '4.3★ / 178', '4.3★ / 184', 'up', 12),

  -- AI / GEO
  ('AI Mentions (ChatGPT/Gemini/Perplexity)', 'AI / GEO', 'Number of times THQ is mentioned in AI assistant responses', '50+/mo', '25', '28', 'up', 13),
  ('AI Cited Pages', 'AI / GEO', 'Number of THQ website pages referenced by AI tools', '100+', '77', '82', 'up', 14),
  ('AI Visibility Score', 'AI / GEO', 'Composite score measuring THQ''s presence in AI-generated content (0-100)', '50', '18', '21', 'up', 15)
on conflict do nothing;
