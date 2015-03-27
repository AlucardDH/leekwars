#Leek Wars Editor Custom Documentation

Bonjour à tous,

En ayant assez de devoir sans arrêt parcourir mes différentes IA pour retrouver la signature exacte d'une de mes fonctions ou me rappeler toutes leurs fonctionnement, j'ai écrit un UserScript (testé sur Chrome avec TamperMonkey) qui permet d'afficher dans la pop-up d'auto-complétion la documentation de mes propres fonctions.

La documentation est écrite dans le style Javadoc (cf. les exemples)
Je n'y ai passé que quelques heures pour l'instant donc n'hésitez pas à me signaler des bugs ou des améliorations possibles.


## Lien de téléchargement :
https://github.com/AlucardDH/leekwars/raw/master/leekwars_custom_documentation.user.js

### Exemples
Et puisque des petites images valent mieux que des longs discours, voici des exemples :
v0.1 :
https://raw.githubusercontent.com/AlucardDH/leekwars/master/examples/ex_function.jpg
https://raw.githubusercontent.com/AlucardDH/leekwars/master/examples/ex_function2.jpg
https://raw.githubusercontent.com/AlucardDH/leekwars/master/examples/ex_var.JPG
https://raw.githubusercontent.com/AlucardDH/leekwars/master/examples/ex_global.jpg
v0.3 :
https://raw.githubusercontent.com/AlucardDH/leekwars/master/examples/ex_completion_plus.jpg
https://raw.githubusercontent.com/AlucardDH/leekwars/master/examples/ex_completion_parameters.jpg
https://raw.githubusercontent.com/AlucardDH/leekwars/master/examples/ex_completion_parameters2.jpg
v0.4 :
https://raw.githubusercontent.com/AlucardDH/leekwars/master/examples/ex_global2.jpg
https://raw.githubusercontent.com/AlucardDH/leekwars/master/examples/ex_ops.jpg
https://raw.githubusercontent.com/AlucardDH/leekwars/master/examples/ex_ops2.jpg
https://raw.githubusercontent.com/AlucardDH/leekwars/master/examples/ex_ops3.jpg

## Note de version :
### v 0.1 (2015-03-25) :
- support des "tag" @level, @param, @result
- descriptions encadrées par /** */
- mise à jour de la documentation toutes les 5s
- ajout du numéro de la ligne de définition de la fonction/variable

### v 0.2 (2015-03-26) : 
- upd : suppression des messages console restant
- fix : encodage des caractères accentués
- add : ajout de l'url de mise à jour

### v 0.3 (2015-03-26) : 
- add : complétion en amont (les fonctions écrites plus loin dans le code apparaissent maintenant)
- add : auto-complétion avec les paramètres et parenthèses

### v 0.4 (2015-03-27) : 
- add : support du tag @ops pour les opérations
- add : documentation de la valeur initiale d'une variable globale
- upd : renommage du script pour installation auto

### v 0.5 (2015-03-27) : 
- upd : compatibilité Firefox/Greasemonkey
- upd : optimisation

### v 0.6 (2015-03-27) : 
- add : affichage des tooltips au survol des fonctions et variables custom documentées
- add : les tooltips des fonctions de base sont maintenant affichées au dessus de la fonction (plutôt qu'en dessous) quand on arrive au bas de la fenêtre

### v 0.6.1 (2015-03-27) : 
- fix : correction du tooltip baladeur sur firefox ?
