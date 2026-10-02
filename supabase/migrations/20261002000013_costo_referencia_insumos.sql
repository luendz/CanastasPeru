-- ============================================================================
-- Costo de referencia de cada producto (precio de compra con IGV).
--
-- Mientras un producto no tenga compras registradas, el costeo de las
-- cotizaciones usa este costo. Los valores iniciales vienen del Excel del
-- cliente (BASE DE DATOS - B&A). Con una compra registrada, manda la compra.
-- ============================================================================

alter table public.insumos
  add column costo_referencia numeric(10, 4) check (costo_referencia is null or costo_referencia >= 0);

update public.insumos i set costo_referencia = v.costo
from (values
  ('Panetón PyC Bolsa 800gr', 12),
  ('Chocolate Oro del Cuzco 90gr', 0.84),
  ('Arroz Paisana Superior 750gr', 2.97),
  ('Azucar Dulfina 1kg', 3.37),
  ('Lentejita Bebe Komilon 400 gr', 1.84),
  ('Fideos Cortos Grano de oro 250gr', 0.74),
  ('Bebida Láctea BONLÉ Protección 390gr', 2.0625),
  ('Mermelada Deli Fresa Sachets 85gr', 0.9676),
  ('Infusion Herbi Caja 25 unid', 0.7438),
  ('Maiz Porcon Komilon 400gr', 1.77),
  ('Avena Komilon 120gr', 0.59),
  ('Fideos Cortos San Jorge 500gr', 0.8),
  ('Leche Ideal Amanecer 390gr', 2.8208),
  ('Bebida Durazno o Naranja o Piña 1LT', 3.4167),
  ('Fideos Largos San Jorge 500gr', 1.6),
  ('Wafer Costa Sabor a Fresa Bolsa 105g', 1.5),
  ('Avena 3 Ositos Clasica 100gr', 0.7083),
  ('Mermelada Fanny sobre 90gr', 1.2537),
  ('Paneton Bimbo Bolsa 900gr', 15),
  ('Aceite Vegetal BELTRAN Botella 500ml', 3.8333),
  ('Paneton Winter Bolsa 850gr', 17.84),
  ('Chocolate de Taza Winter 90gr', 1.9008),
  ('Aceite Vegetal Primor 500ml', 4.525),
  ('Galleta Navidad Colombina 150gr', 3.5),
  ('Conserva de durazno Arica 820 gr', 6.1667),
  ('Fideos Nicolini Cortos 250gr', 1.025),
  ('Fideos Nicolini Spaguetti 500gr', 2.025),
  ('Trozos de Atún FANNY en Aceite Vegetal Lata 140 gr', 4.025),
  ('Leche Ideal Cremosita 390gr', 3.4167),
  ('Gelatina Universal sobre 130gr', 2.4708),
  ('Salsa Clásica de Tomate POMAROLA Doypack 145g', 0.9583),
  ('Cafetal Selecto Tostado y molido 50gr', 2.5694),
  ('Paneton Bimbo o Bon Natale Bolsa 850 gr', 16.25),
  ('Espumante Queirolo Primado 750ml', 10.8333),
  ('Chocolate de Taza sol del cuzco 90gr', 2.025),
  ('Mermelada Fanny pote 310gr', 4.5167),
  ('Aceituna Verde Deshuesada Doypack 180gr', 2.6078),
  ('Paneton Donofrio Bolsa 880gr', 22.5),
  ('Aceite Vegetal Primor 900 ml', 7.7667),
  ('Fideos Cortos Molitalia 250gr', 1.11),
  ('Fideos Largos Molitalia 500gr', 2.125),
  ('Filete de Atún Florida en Aceite Vegetal Lata 140gr', 4.7146),
  ('Infusion McCollins Caja 25 unid', 2.1125),
  ('Leche Gloria Azul 390gr', 3.5083),
  ('Marshmallow AMBROSOLI Surtidos Bolsa 230gr', 3.45),
  ('Papas Kryzpo Sabor Original 37gr', 2.7181),
  ('Paneton Chocoton en Caja 450gr', 24.9167),
  ('Espumante Queirolo Primadona 750ml', 16.6667),
  ('Sangria Queirolo Caja 1Lt', 11.6667),
  ('Chocolate a la taza Winter 43% cacao 90gr', 4.5),
  ('Bolsa Noche Buena 150g', 3.51),
  ('Café Colcafé Capuccino Mocca Caja 78gr', 11.6),
  ('Bombones Ferrero Rocher 4unid', 10),
  ('Tapenade Cale mix aceitunas o aji 185gr', 5.0858),
  ('Cocktail de Nueces Valle Alto taper 200 gr', 9.6),
  ('Penillo encurtidos en Vinagres 240gr', 5.9472),
  ('Paneton Donofrio Caja 880gr', 24.9167),
  ('Vino Santiago Queirolo Portus Botella 750ml', 12.1667),
  ('Chocolate de taza La Iberica sin azucar 100% cacao 100gr', 13),
  ('Galleta Danessa en Lata 114gr', 5),
  ('Aceituna Verde rellena con pimiento natural 240gr', 5.8292),
  ('Galleta Danessa en Lata 280gr', 14),
  ('Cabanossi Braedt al Vacío Empaque 25gr', 2),
  ('Pure Casa Verde de Manzana y Mago 370gr', 6.1),
  ('Espumante Ricadonna 750ml', 45),
  ('Vino Casillero del Diablo 750 ml', 25)
) as v(nombre, costo)
where i.nombre = v.nombre;
