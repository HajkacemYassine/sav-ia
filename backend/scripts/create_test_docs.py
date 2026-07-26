import os

# Crée un dossier pour les docs
os.makedirs("data/docs", exist_ok=True)

# Faux manuel technique
with open("data/docs/manuel_laveinge.txt", "w", encoding="utf-8") as f:
    f.write("""
MANUEL TECHNIQUE - LAVE-LINGE SAMSUNG WW90T

PROBLEME : Fuite d'eau sous la porte
CAUSE : Joint de porte usé ou mal positionné
SOLUTION : 
1. Débrancher l'appareil
2. Retirer le joint de porte (référence JNT-001)
3. Nettoyer le logement
4. Installer le nouveau joint
5. Tester l'étanchéité

PROBLEME : Tambour ne tourne pas
CAUSE : Courroie de transmission cassée
SOLUTION :
1. Débrancher l'appareil
2. Retirer le panneau arrière
3. Remplacer la courroie (référence CRR-045)
4. Remonter et tester

PROBLEME : Lave-linge ne démarre pas
CAUSE : Carte électronique défaillante
SOLUTION :
1. Vérifier l'alimentation électrique
2. Réinitialiser (débrancher 5 min)
3. Si persiste : remplacer la carte (référence PCB-S90)
""")

# Fausse FAQ
with open("data/docs/faq.txt", "w", encoding="utf-8") as f:
    f.write("""
FAQ - SERVICE APRES VENTE

Q: Mon appareil est sous garantie, la réparation est-elle gratuite ?
R: Oui, si votre appareil est sous garantie constructeur, la réparation est prise en charge.

Q: Combien de temps dure une réparation ?
R: En moyenne 3 à 5 jours ouvrés selon la disponibilité des pièces.

Q: Comment suivre mon ticket SAV ?
R: Connectez-vous avec votre ID client et consultez la section "Mes tickets".

Q: Mon compresseur fait du bruit anormal ?
R: Un bruit de vibration peut indiquer un problème de fixation ou de roulement usé.
""")

print("✅ Documents de test créés dans data/docs/")