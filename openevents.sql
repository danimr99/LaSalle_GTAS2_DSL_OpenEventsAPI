SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Database: `openevents`
--

CREATE DATABASE IF NOT EXISTS openevents;
USE openevents;

-- --------------------------------------------------------

--
-- Table: `assistances`
--

CREATE TABLE `assistances` (
  `user_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `punctuation` int(11) DEFAULT NULL,
  `comment` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table: `events`
--

CREATE TABLE `events` (
  `id` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `owner_id` int(11) DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  `image` varchar(200) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `eventStart_date` datetime DEFAULT NULL,
  `eventEnd_date` datetime DEFAULT NULL,
  `n_participators` int(11) DEFAULT NULL,
  `slug` varchar(50) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table: `friends`
--

CREATE TABLE `friends` (
  `user_id` int(11) NOT NULL,
  `user_id_friend` int(11) NOT NULL,
  `status` int(11) NOT NULL DEFAULT 0 COMMENT '0: REQUESTED\n1: ACCEPTED\n'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table: `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `content` varchar(500) NOT NULL,
  `user_id_send` int(11) NOT NULL,
  `user_id_received` int(11) NOT NULL,
  `timestamp` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table: `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  `password` varchar(250) DEFAULT NULL,
  `image` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Indexes of the table: `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`);

--
-- Indexes of the table: `friends`
--
ALTER TABLE `friends`
  ADD PRIMARY KEY (`user_id`,`user_id_friend`);

--
-- Indexes of the table: `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes of the table: `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email_UNIQUE` (`email`);

--
-- AUTO_INCREMENT of the table: `events`
--
ALTER TABLE `events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT of the table: `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT of the table: `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;