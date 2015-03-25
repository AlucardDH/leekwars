#Leek Wars Editor Custom Documentation

Bonjour à tous,

En ayant assez de devoir sans arrêt parcourir mes différentes IA pour retrouver la signature exacte d'une de mes fonctions ou me rappeler toutes leurs fonctionnement, j'ai écrit un UserScript (testé sur Chrome avec TamperMonkey) qui permet d'afficher dans la pop-up d'auto-complétion la documentation de mes propres fonctions.

La documentation est écrite dans le style Javadoc (cf. les exemples)
Je n'y ai passé que quelques heures pour l'instant donc n'hésitez pas à me signaler des bugs ou des améliorations possibles.


## Lien de téléchargement :
* https://github.com/AlucardDH/leekwars/raw/master/leekwars_custom_documentation.js *

### Exemples
Et puisque des petites images valent mieux que des longs discours, voici des exemples :
https://raw.githubusercontent.com/AlucardDH/leekwars/master/examples/ex_function.jpg
https://raw.githubusercontent.com/AlucardDH/leekwars/master/examples/ex_function2.jpg
https://raw.githubusercontent.com/AlucardDH/leekwars/master/examples/ex_var.JPG
https://raw.githubusercontent.com/AlucardDH/leekwars/master/examples/ex_global.jpg

## Note de version :
* v 0.1 (2015-03-25) : *
- support des "tag" @level, @param, @result
- descriptions encadrées par //** *//
- mise à jour de la documentation toutes les 5s
- ajout du numéro de la ligne de définition de la fonction/variable
