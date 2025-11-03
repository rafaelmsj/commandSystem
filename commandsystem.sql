-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 03/11/2025 às 18:19
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `commandsystem`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `client`
--

CREATE TABLE `client` (
  `id` int(11) NOT NULL,
  `name` varchar(250) NOT NULL,
  `number` varchar(15) NOT NULL,
  `endereco` longtext NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `modifiedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `colocacoes`
--

CREATE TABLE `colocacoes` (
  `id` int(11) NOT NULL,
  `rifa_id` int(11) NOT NULL,
  `posicao` int(11) NOT NULL,
  `ganhador_nome` text DEFAULT NULL,
  `ganhador_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `comanda`
--

CREATE TABLE `comanda` (
  `id` int(11) NOT NULL,
  `clienteId` int(11) NOT NULL,
  `cliente` varchar(250) NOT NULL,
  `status` varchar(50) NOT NULL,
  `valorTotal` decimal(10,2) NOT NULL,
  `valorPago` decimal(10,2) NOT NULL,
  `saldoRestante` decimal(10,2) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `lancamentos_produtos`
--

CREATE TABLE `lancamentos_produtos` (
  `id` int(11) NOT NULL,
  `comanda_id` int(11) NOT NULL,
  `produto_id` int(11) NOT NULL,
  `valor_lancado` decimal(10,2) NOT NULL,
  `quantidade` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `lavacoes`
--

CREATE TABLE `lavacoes` (
  `id` int(11) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `pago` tinyint(1) DEFAULT 0,
  `forma_pagamento` enum('dinheiro','pix','cartao_credito','cartao_debito','outro') DEFAULT NULL,
  `observacoes` text DEFAULT NULL,
  `data_lavagem` timestamp NOT NULL DEFAULT current_timestamp(),
  `placa` varchar(10) DEFAULT NULL,
  `carro` varchar(100) DEFAULT NULL,
  `cliente` varchar(100) DEFAULT NULL,
  `desconto` tinyint(4) DEFAULT 0,
  `modified` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `movimentacao_estoque`
--

CREATE TABLE `movimentacao_estoque` (
  `id` int(11) NOT NULL,
  `produto_id` int(11) NOT NULL,
  `cliente_id` int(11) DEFAULT NULL,
  `origem` enum('rifa','conveniencia') NOT NULL,
  `tipo` enum('saida','entrada') NOT NULL,
  `quantidade` int(11) NOT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `pagamentos`
--

CREATE TABLE `pagamentos` (
  `id` int(11) NOT NULL,
  `comanda_id` int(11) NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `metodo_pagamento` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `premios`
--

CREATE TABLE `premios` (
  `id` int(11) NOT NULL,
  `colocacao_id` int(11) NOT NULL,
  `produto_id` int(11) NOT NULL,
  `quantidade` int(11) NOT NULL DEFAULT 1,
  `status_entrega` enum('pendente','entregue') NOT NULL DEFAULT 'pendente',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `produto`
--

CREATE TABLE `produto` (
  `id` int(11) NOT NULL,
  `nome` varchar(250) NOT NULL,
  `valorPadrao` decimal(10,2) NOT NULL,
  `estoque_atual` int(11) NOT NULL DEFAULT 0,
  `estoque_minimo` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `modifiedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `rifas`
--

CREATE TABLE `rifas` (
  `id` int(11) NOT NULL,
  `nome` text NOT NULL,
  `data` date NOT NULL,
  `quantidade_ganhadores` int(11) NOT NULL DEFAULT 1,
  `status` enum('em_andamento','finalizada') NOT NULL DEFAULT 'em_andamento',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `nome` varchar(120) NOT NULL,
  `email` varchar(200) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','user') DEFAULT 'user',
  `ativo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `users`
--

INSERT INTO `users` (`id`, `nome`, `email`, `password_hash`, `role`, `ativo`, `created_at`) VALUES
(1, 'Administrador', 'admin@conveniencia.com', '$2b$10$jYwDN3siFURqGg5XUc32n.9tJr/zMZkoAsNztnan8zJCmBfhVdyC2', 'admin', 1, '2025-11-03 16:25:58');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `client`
--
ALTER TABLE `client`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `colocacoes`
--
ALTER TABLE `colocacoes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_posicao` (`rifa_id`,`posicao`);

--
-- Índices de tabela `comanda`
--
ALTER TABLE `comanda`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `lancamentos_produtos`
--
ALTER TABLE `lancamentos_produtos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `comanda_id` (`comanda_id`),
  ADD KEY `produto_id` (`produto_id`);

--
-- Índices de tabela `lavacoes`
--
ALTER TABLE `lavacoes`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `movimentacao_estoque`
--
ALTER TABLE `movimentacao_estoque`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `pagamentos`
--
ALTER TABLE `pagamentos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `comanda_id` (`comanda_id`);

--
-- Índices de tabela `premios`
--
ALTER TABLE `premios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_premios_colocacao` (`colocacao_id`);

--
-- Índices de tabela `produto`
--
ALTER TABLE `produto`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `rifas`
--
ALTER TABLE `rifas`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `client`
--
ALTER TABLE `client`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `colocacoes`
--
ALTER TABLE `colocacoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `comanda`
--
ALTER TABLE `comanda`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `lancamentos_produtos`
--
ALTER TABLE `lancamentos_produtos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `lavacoes`
--
ALTER TABLE `lavacoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `movimentacao_estoque`
--
ALTER TABLE `movimentacao_estoque`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `pagamentos`
--
ALTER TABLE `pagamentos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `premios`
--
ALTER TABLE `premios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `produto`
--
ALTER TABLE `produto`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `rifas`
--
ALTER TABLE `rifas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
