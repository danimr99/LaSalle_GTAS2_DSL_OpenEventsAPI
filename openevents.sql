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
-- Table: `assistance`
--

CREATE TABLE `assistance` (
  `user_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `puntuation` int(11) DEFAULT NULL,
  `comentary` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table: `events`
--

CREATE TABLE `events` (
  `id` int(11) NOT NULL,
  `name` varchar(45) DEFAULT NULL,
  `owner_id` int(11) DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  `image` varchar(200) DEFAULT NULL,
  `location` varchar(45) DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `eventStart_date` datetime DEFAULT NULL,
  `eventEnd_date` datetime DEFAULT NULL,
  `n_participators` int(11) DEFAULT NULL,
  `slug` varchar(45) DEFAULT NULL,
  `type` varchar(45) DEFAULT NULL
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
-- Table: `message`
--

CREATE TABLE `message` (
  `id` int(11) NOT NULL,
  `content` varchar(45) NOT NULL,
  `user_id_send` int(11) NOT NULL,
  `user_id_recived` int(11) NOT NULL,
  `timeStamp` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table: `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(45) DEFAULT NULL,
  `last_name` varchar(45) DEFAULT NULL,
  `email` varchar(45) DEFAULT NULL,
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
-- Indexes of the table: `message`
--
ALTER TABLE `message`
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
-- AUTO_INCREMENT of the table: `message`
--
ALTER TABLE `message`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT of the table: `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;