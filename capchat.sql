-- phpMyAdmin SQL Dump
-- version 4.8.3
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le :  Dim 02 juin 2019 à 01:09
-- Version du serveur :  5.7.23
-- Version de PHP :  7.2.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données :  `capchat`
--

-- --------------------------------------------------------

--
-- Structure de la table `artist`
--

DROP TABLE IF EXISTS `artist`;
CREATE TABLE IF NOT EXISTS `artist` (
  `idArtist` int(11) NOT NULL AUTO_INCREMENT,
  `UserId` int(11) NOT NULL,
  PRIMARY KEY (`idArtist`),
  KEY `FK_ID_ARTIST` (`UserId`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=latin1;

--
-- Déchargement des données de la table `artist`
--

INSERT INTO `artist` (`idArtist`, `UserId`) VALUES
(1, 1),
(3, 4),
(4, 5),
(5, 6);

-- --------------------------------------------------------

--
-- Structure de la table `image`
--

DROP TABLE IF EXISTS `image`;
CREATE TABLE IF NOT EXISTS `image` (
  `idImg` int(11) NOT NULL AUTO_INCREMENT,
  `nomImg` varchar(255) NOT NULL,
  `indice` varchar(255) DEFAULT NULL,
  `idSet` int(11) NOT NULL,
  PRIMARY KEY (`idImg`)
) ENGINE=InnoDB AUTO_INCREMENT=121 DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Structure de la table `imageset`
--

DROP TABLE IF EXISTS `imageset`;
CREATE TABLE IF NOT EXISTS `imageset` (
  `idSet` int(11) NOT NULL AUTO_INCREMENT,
  `setName` varchar(255) NOT NULL,
  `setUrl` varchar(255) NOT NULL,
  `idTheme` int(11) NOT NULL,
  `idArtist` int(11) NOT NULL,
  PRIMARY KEY (`idSet`),
  KEY `FK_IDTHEME` (`idTheme`),
  KEY `FK_IDARTIST` (`idArtist`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Structure de la table `theme`
--

DROP TABLE IF EXISTS `theme`;
CREATE TABLE IF NOT EXISTS `theme` (
  `idTheme` int(11) NOT NULL AUTO_INCREMENT,
  `themeName` varchar(255) NOT NULL,
  PRIMARY KEY (`idTheme`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;

--
-- Déchargement des données de la table `theme`
--

INSERT INTO `theme` (`idTheme`, `themeName`) VALUES
(1, 'Animals'),
(2, 'Cheeses'),
(3, 'Fruits'),
(4, 'Humans');

-- --------------------------------------------------------

--
-- Structure de la table `user`
--

DROP TABLE IF EXISTS `user`;
CREATE TABLE IF NOT EXISTS `user` (
  `uId` int(11) NOT NULL AUTO_INCREMENT,
  `uLogin` varchar(255) NOT NULL,
  `uPass` varchar(255) NOT NULL,
  `uMail` varchar(255) NOT NULL,
  `last_token` varchar(255) DEFAULT NULL,
  `date_token` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`uId`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;

--
-- Déchargement des données de la table `user`
--

INSERT INTO `user` (`uId`, `uLogin`, `uPass`, `uMail`, `last_token`, `date_token`) VALUES
(1, 'Certain', 'Maxime', 'aa@mail.fr', NULL, NULL),
(2, 'Zire', 'Levy', 'Levy', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjoxNTU4Nzk1NjgyNjQ3LCJpYXQiOjE1NTg3OTU2ODIsImV4cCI6MTU1ODc5OTI4Mn0.-STls00eG9HnOs_fJnKVwCH6jLggH_3A0DRZxe-6tVo', '2019-05-25 16:48:02'),
(4, 'Marcel', 'Maxie', 'aa@mail.fr', NULL, NULL),
(5, 'aless', 'aless', 'aa@mail.fr', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjoxNTU4ODc1MTc2MzU5LCJpYXQiOjE1NTg4NzUxNzYsImV4cCI6MTU1ODg3ODc3Nn0.lqIhIAz_dsmRp4qOwz84KI2DgUp3JrOU7x5O79qUdag', '2019-05-26 14:52:56'),
(6, 'toto', 'toto', 'toto@mail.fr', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjoxNTU5NDMwMjEyNTE1LCJpYXQiOjE1NTk0MzAyMTIsImV4cCI6MTU1OTQzMzgxMn0.mORmj6OMXaKGXRcxgEfHsylKiycIMytzO5HlrXgQii4', '2019-06-02 01:03:32'),
(7, 'user', 'user', 'aa@mail.fr', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjoxNTU5NDMwMzE0OTI1LCJpYXQiOjE1NTk0MzAzMTQsImV4cCI6MTU1OTQzMzkxNH0.pjyWsFHFwmoUPKeJuzDTunhp1EQLOSdwMV7aHfFzr50', '2019-06-02 01:05:14');

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `artist`
--
ALTER TABLE `artist`
  ADD CONSTRAINT `FK_ID_ARTIST` FOREIGN KEY (`UserId`) REFERENCES `user` (`uId`);

--
-- Contraintes pour la table `imageset`
--
ALTER TABLE `imageset`
  ADD CONSTRAINT `FK_IDARTIST` FOREIGN KEY (`idArtist`) REFERENCES `artist` (`idArtist`),
  ADD CONSTRAINT `FK_IDTHEME` FOREIGN KEY (`idTheme`) REFERENCES `theme` (`idTheme`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
